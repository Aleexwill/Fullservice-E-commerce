import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getGeminiModel, generateWithRetry } from '@/lib/gemini';

const SYSTEM_PROMPT = `Eres un asistente experto en elaborar presupuestos para Full Service & Clean, empresa de mantenimiento, limpieza y construcción civil en Paraguay.

Tu tarea: analizar la descripción o imagen que envía el admin y generar un borrador de presupuesto estructurado en JSON.

Tipos de servicio disponibles: mantenimiento | civil | metalurgica | otro

Tipos de fila en la planilla de costos:
- "titulo": encabezado de sección (sin precio, agrupa las filas siguientes)
- "material": insumos, productos, materiales
- "mano_obra": trabajo de personas (horas, jornadas, visitas)
- "otro": servicios tercerizados, transporte, alquiler de equipos

Moneda: Guaraníes paraguayos (Gs.). Precios realistas del mercado paraguayo 2024.
Ejemplos de precios orientativos:
- Mano de obra: Gs. 80.000–150.000 por jornada de 8hs
- Limpiador multiusos 1L: Gs. 15.000–25.000
- Desengrasante industrial 1L: Gs. 30.000–50.000
- Andamio alquiler por día: Gs. 80.000–150.000

Responde SOLO con JSON válido, sin texto adicional, con esta estructura exacta:

{
  "serviceTitle": "título conciso del servicio",
  "serviceType": "mantenimiento|civil|metalurgica|otro",
  "description": "descripción clara del trabajo a realizar (2-3 oraciones)",
  "details": "detalles técnicos, condiciones, consideraciones adicionales",
  "estimatedDuration": "ej: 2 días, 4 horas, 1 semana",
  "priority": "baja|media|alta|urgente",
  "estimatedValue": 350000,
  "calculationData": {
    "filas": [
      {
        "tipo": "titulo",
        "descripcion": "MANO DE OBRA",
        "unidad": "",
        "cantidad": 0,
        "precioUnitario": 0,
        "precioVenta": 0,
        "alcance": "descripción del alcance de esta sección"
      },
      {
        "tipo": "mano_obra",
        "descripcion": "Operario especializado",
        "unidad": "jornada",
        "cantidad": 2,
        "precioUnitario": 120000,
        "precioVenta": 120000
      }
    ],
    "iva": 10,
    "descuento": 0,
    "validez": "10 días",
    "ubicacion": "",
    "observaciones": "Precios sujetos a relevamiento final y disponibilidad de materiales. No incluye trabajos no detallados."
  }
}`;

export async function POST(req: NextRequest) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 503 });
  }

  const model = getGeminiModel(apiKey, SYSTEM_PROMPT);

  const body = await req.json();
  const { texto, imagen, mimeType } = body as {
    texto?: string;
    imagen?: string; // base64
    mimeType?: string;
  };

  if (!texto && !imagen) {
    return NextResponse.json({ error: 'Se requiere texto o imagen' }, { status: 400 });
  }

  const parts: any[] = [];

  if (imagen) {
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imagen,
      },
    });
  }

  parts.push({
    text: texto
      ? `Solicitud del cliente:\n${texto}\n\nGenerá el presupuesto en JSON.`
      : 'Analizá esta imagen y generá el presupuesto en JSON.',
  });

  try {
    const text = await generateWithRetry(model, parts);

    // Extraer JSON de la respuesta (por si viene con markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Respuesta inesperada del modelo' }, { status: 500 });
    }

    const resultado = JSON.parse(jsonMatch[0]);

    // Agregar IDs a las filas
    if (!resultado.calculationData || !Array.isArray(resultado.calculationData.filas)) {
      resultado.calculationData = { filas: [], iva: 10, descuento: 0, validez: '10 días', ubicacion: '', observaciones: '' };
    }
    resultado.calculationData.filas = resultado.calculationData.filas.map((f: any) => ({
      ...f,
      id: crypto.randomUUID(),
      precioVenta: f.precioVenta ?? (f.precioUnitario ?? 0) * (f.cantidad ?? 1),
    }));

    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error('[analizar-presupuesto]', err);
    const is503 = err?.message?.includes('503');
    return NextResponse.json(
      { error: is503 ? 'El servicio de IA está temporalmente saturado. Intentá en unos segundos.' : (err.message ?? 'Error al procesar') },
      { status: is503 ? 503 : 500 },
    );
  }
}
