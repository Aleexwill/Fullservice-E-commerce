import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM = 'Sos un corrector de textos técnicos de construcción en español paraguayo. Corregís ortografía, gramática y puntuación, y mejorás la redacción para que suene profesional en un presupuesto de obra. No inventás datos, precios, materiales ni plazos que no estén en el texto. No agregás comentarios ni comillas: devolvés únicamente el texto corregido, sin explicaciones.';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 503 });
  }

  const { texto } = await req.json();
  if (!texto?.trim()) {
    return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: SYSTEM,
    });

    const result = await model.generateContent(texto.trim());
    const resultado = result.response.text().trim().replace(/^["'"]|["'"]$/g, '');

    return NextResponse.json({ resultado });
  } catch (err: any) {
    console.error('[ai/corregir]', err);
    return NextResponse.json({ error: err.message ?? 'Error al procesar' }, { status: 500 });
  }
}
