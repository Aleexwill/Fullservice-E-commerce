import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// POST /api/materiales/import
// Body: multipart/form-data with file=<xlsx>  OR  JSON { rows: [...] }
// Query: ?confirm=1  → actually insert; otherwise just parse & validate

export async function POST(req: NextRequest) {
  const auth = await requireRole('canManageInventory');
  if (auth instanceof NextResponse) return auth;

  try {
    const confirm = req.nextUrl.searchParams.get('confirm') === '1';

    // ── Parse phase ──────────────────────────────────────────────
    if (!confirm) {
      const ct = req.headers.get('content-type') || '';
      let rows: ParsedRow[] = [];

      if (ct.includes('multipart/form-data')) {
        const form = await req.formData();
        const file = form.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
        const buf = Buffer.from(await file.arrayBuffer());
        rows = parseXlsx(buf);
      } else {
        return NextResponse.json({ error: 'Usar multipart/form-data con campo "file"' }, { status: 400 });
      }

      const validated = rows.map(r => validate(r));
      return NextResponse.json({ rows: validated, total: validated.length });
    }

    // ── Confirm phase ─────────────────────────────────────────────
    const body = await req.json() as { rows: ValidatedRow[] };
    const toInsert = (body.rows || []).filter(r => r.status !== 'error');

    if (toInsert.length === 0)
      return NextResponse.json({ error: 'No hay filas válidas para importar' }, { status: 400 });

    const created = await prisma.$transaction(
      toInsert.map(r =>
        prisma.material.create({
          data: {
            description: r.description.trim(),
            unit: r.unit?.trim() || 'un',
            unitPrice: r.unitPrice!,
            provider: r.provider?.trim() || '',
            category: r.category?.trim() || 'general',
            code: '',
            notes: r.notes?.trim() || '',
          },
        })
      )
    );

    return NextResponse.json({ inserted: created.length });
  } catch (error) {
    console.error('Error en POST /api/materiales/import:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: `Error al importar: ${message}` }, { status: 500 });
  }
}

// ── Types ─────────────────────────────────────────────────────────

interface ParsedRow {
  rowNum: number;
  description: string;
  unitPrice: string;
  unit: string;
  provider: string;
  category: string;
  notes: string;
}

export interface ValidatedRow extends ParsedRow {
  unitPrice: any;
  status: 'ok' | 'warning' | 'error';
  warnings: string[];
  errors: string[];
}

// ── Parser: supports the PRECIOS.xlsx layout ──────────────────────
// The file has two table sections side by side:
//   Materiales:  A=ITEN  B=DESCRIPCION  C=P.U  D=UN/MED  E=PROVEEDOR
//   Servicios:   I=ITEN  J=DESCRIPCION  K=P.U  L=UN/MED  M=PROVEEDOR
// Row 1 = section titles, Row 2 = column headers → skip both

function parseXlsx(buf: Buffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const rows: ParsedRow[] = [];

  // Detect header row (contains "DESCRIPCION" or "descripcion" in col B or J)
  let startRow = 0;
  for (let i = 0; i < Math.min(raw.length, 5); i++) {
    const r = raw[i];
    const hasHeader = String(r[1] || '').toLowerCase().includes('descri') ||
                      String(r[9] || '').toLowerCase().includes('descri');
    if (hasHeader) { startRow = i + 1; break; }
  }

  for (let i = startRow; i < raw.length; i++) {
    const r = raw[i];
    const rowNum = i + 1;

    // Left table: Materiales (cols A=0,B=1,C=2,D=3,E=4)
    const descA = String(r[1] || '').trim();
    const priceA = String(r[2] || '').trim();
    if (descA && !descA.toLowerCase().startsWith('iten')) {
      rows.push({
        rowNum,
        description: descA,
        unitPrice: priceA,
        unit: String(r[3] || '').trim() || 'un',
        provider: String(r[4] || '').trim(),
        category: 'general',
        notes: String(r[5] || '').trim(),
      });
    }

    // Right table: Servicios (cols I=8,J=9,K=10,L=11,M=12)
    const descJ = String(r[9] || '').trim();
    const priceJ = String(r[10] || '').trim();
    if (descJ && !descJ.toLowerCase().startsWith('iten') && !descJ.toLowerCase().startsWith('descri')) {
      rows.push({
        rowNum,
        description: descJ,
        unitPrice: priceJ,
        unit: String(r[11] || '').trim() || 'un',
        provider: String(r[12] || '').trim(),
        category: 'mano_obra',
        notes: '',
      });
    }
  }

  return rows;
}

// ── Validator ─────────────────────────────────────────────────────

function validate(r: ParsedRow): ValidatedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!r.description) errors.push('Descripción vacía');

  // Parse price: handle "151.452" (Paraguayan format: dot as thousands sep)
  let unitPrice: number | null = null;
  const raw = r.unitPrice.replace(/\s/g, '');
  if (raw) {
    // If it has a comma → European decimal: 1.234,56 → remove dots, replace comma
    if (raw.includes(',')) {
      unitPrice = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    } else {
      // dot could be thousands separator (151.452 = 151452) or decimal (151.5)
      // heuristic: if > 3 digits after dot it's thousands sep
      const parts = raw.split('.');
      if (parts.length === 2 && parts[1].length >= 3) {
        unitPrice = parseFloat(parts.join(''));
      } else {
        unitPrice = parseFloat(raw);
      }
    }
    if (isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`Precio inválido: "${r.unitPrice}"`);
      unitPrice = null;
    }
  } else {
    errors.push('Precio vacío');
  }

  if (!r.provider) warnings.push('Proveedor no especificado');
  if (!r.unit) warnings.push('Unidad no especificada');

  const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok';

  return { ...r, unitPrice, status, errors, warnings };
}
