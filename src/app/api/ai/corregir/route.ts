import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getGeminiModel, GEMINI_MODEL_ID } from '@/lib/gemini';
import { autorizarIA, generarConGemini } from '@/lib/ia/uso';

const SYSTEM = 'Sos un corrector de textos técnicos de construcción en español paraguayo. Corregís ortografía, gramática y puntuación, y mejorás la redacción para que suene profesional en un presupuesto de obra. No inventás datos, precios, materiales ni plazos que no estén en el texto. No agregás comentarios ni comillas: devolvés únicamente el texto corregido, sin explicaciones.';

export async function POST(req: NextRequest) {
  const auth = await requireRole('canManagePresupuestos');
  if (auth instanceof NextResponse) return auth;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 503 });
  }

  const bloqueo = await autorizarIA('corregir-texto', auth);
  if (bloqueo) return bloqueo;

  const { texto } = await req.json();
  if (!texto?.trim()) {
    return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
  }

  try {
    const model = getGeminiModel(apiKey, SYSTEM);
    const text = await generarConGemini({ funcion: 'corregir-texto', modelo: GEMINI_MODEL_ID, session: auth }, model, texto.trim());
    const resultado = text.trim().replace(/^["'"]|["'"]$/g, '');
    return NextResponse.json({ resultado });
  } catch (err: any) {
    console.error('[ai/corregir]', err);
    const is503 = err?.message?.includes('503');
    return NextResponse.json(
      { error: is503 ? 'El servicio de IA está temporalmente saturado. Intentá en unos segundos.' : (err.message ?? 'Error al procesar') },
      { status: is503 ? 503 : 500 },
    );
  }
}
