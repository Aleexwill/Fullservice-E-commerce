import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getGeminiModel, generateWithRetry } from '@/lib/gemini';

const SYSTEM_PROMPT = `Eres un asistente experto en presupuestos de construcción, herrería y mantenimiento para Full Service & Clean en Paraguay.
El admin te envía el estado actual de un presupuesto (rubros, materiales, mano de obra, márgenes, etc.) y una instrucción en lenguaje natural.
Tu tarea: aplicar exactamente lo que pide y devolver el estado completo MODIFICADO en JSON.

REGLAS IMPORTANTES:
- Devolvé SOLO el JSON del estado completo actualizado, sin texto extra ni markdown.
- Respetá la estructura exacta de cada campo (mats, mos, flete, etc.).
- Cuando modifiques precios o márgenes, aplicalo a los campos correctos.
- Si pedís agregar un material, añadilo con id = Date.now() (usa un número único como 9001, 9002…).
- Si el admin pide algo imposible o ambiguo, devolvé el estado sin cambios y agregá un campo "__aviso" con la explicación.
- Moneda: Guaraníes paraguayos. Precios de mercado PY 2024-2025.
- Campos de un material (mat): id, desc, unidad, cant, costo, desp, marg
- Campos de mano de obra (mo): id, desc, pers, horas, vh, marg
- Campos de un rubro: id, nombre, mats[], mos[], flete, equipos, subcontratos, varios, overhead, margen, descMat, descMo, incluir

Estructura JSON de respuesta:
{
  "rubros": [...],
  "descuento": "0",
  "iva": "10",
  "cliente": "...",
  "obra": "...",
  "domicilio": "...",
  "contacto": "...",
  "plazo": "...",
  "validez": "...",
  "pago": "...",
  "alcance": "...",
  "firmaNombre": "...",
  "firmaCargo": "...",
  "mostrarMO": false,
  "mostrarOtros": false,
  "__aviso": ""
}`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  try {
    const body = await req.json();
    const { estado, mensaje, historial } = body as {
      estado: Record<string, unknown>;
      mensaje: string;
      historial?: { rol: 'user' | 'model'; texto: string }[];
    };

    if (!mensaje?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    if (!estado?.rubros) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Sin clave Gemini' }, { status: 500 });

    const model = getGeminiModel(apiKey, SYSTEM_PROMPT);

    // Build context: current state + conversation history + new message
    const estadoStr = JSON.stringify(estado, null, 2);
    const historialStr = (historial || [])
      .map(h => `${h.rol === 'user' ? 'Admin' : 'Asistente'}: ${h.texto}`)
      .join('\n');

    const prompt = [
      `ESTADO ACTUAL DEL PRESUPUESTO:\n${estadoStr}`,
      historialStr ? `\nCONVERSACIÓN PREVIA:\n${historialStr}` : '',
      `\nINSTRUCCIÓN DEL ADMIN: ${mensaje.trim()}`,
    ].filter(Boolean).join('\n');

    const text = await generateWithRetry(model, [{ text: prompt }]);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Respuesta inesperada del modelo' }, { status: 500 });

    const nuevoEstado = JSON.parse(jsonMatch[0]);
    const aviso = nuevoEstado.__aviso || '';
    delete nuevoEstado.__aviso;

    return NextResponse.json({ estado: nuevoEstado, aviso });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('ajustar presupuesto:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
