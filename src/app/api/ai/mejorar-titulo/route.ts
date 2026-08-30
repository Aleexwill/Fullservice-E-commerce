import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI no configurada (GROQ_API_KEY)' }, { status: 503 });
  }

  try {
    const { texto, contexto } = await request.json();
    if (!texto?.trim()) {
      return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
    }

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 100,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: `Eres asistente de redacción técnica para presupuestos de servicios de mantenimiento, construcción civil y metalúrgica en Paraguay. Mejora y clarifica el siguiente título de sección de presupuesto.

REGLAS:
- Devuelve SOLO el texto mejorado, sin comillas, sin explicaciones, sin markdown
- Español profesional, claro y conciso
- Máximo 80 caracteres
- Mantén el significado original
- No inventes información técnica
${contexto ? `- Contexto del servicio: ${contexto}` : ''}

TEXTO A MEJORAR:
${texto}`,
        },
      ],
    });

    const resultado = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ texto: resultado });
  } catch (error: any) {
    const msg = error?.message ?? 'Error al procesar';
    console.error('Groq error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
