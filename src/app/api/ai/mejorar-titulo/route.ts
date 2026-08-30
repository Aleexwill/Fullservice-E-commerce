import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-YOUR-KEY-HERE') {
    return NextResponse.json({ error: 'AI no configurada' }, { status: 503 });
  }

  try {
    const { texto, contexto } = await request.json();
    if (!texto?.trim()) {
      return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
    }

    const prompt = `Eres asistente de redacción técnica para presupuestos de servicios de mantenimiento, construcción civil y metalúrgica en Paraguay. Mejora y clarifica el siguiente título o descripción de sección de presupuesto.

REGLAS:
- Devuelve SOLO el texto mejorado, sin comillas, sin explicaciones, sin markdown
- Español profesional, claro y conciso
- Máximo 80 caracteres
- Mantén el significado original
- No inventes información técnica
${contexto ? `- Contexto del servicio: ${contexto}` : ''}

TEXTO A MEJORAR:
${texto}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message ?? `OpenAI ${res.status}`;
      console.error('OpenAI error:', msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    const data = await res.json();
    const resultado = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ texto: resultado });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
