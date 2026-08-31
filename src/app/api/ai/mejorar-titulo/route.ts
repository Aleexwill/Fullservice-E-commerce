import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function fallbackMejorar(texto: string): string {
  // Capitaliza primera letra, recorta espacios, elimina puntos finales redundantes
  return texto.trim().replace(/\s+/g, ' ').replace(/\.+$/, '').replace(/^\w/, (c) => c.toUpperCase());
}

export async function POST(request: NextRequest) {
  try {
    const { texto, contexto } = await request.json();
    if (!texto?.trim()) {
      return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
    }

    if (OPENAI_API_KEY && OPENAI_API_KEY.length > 10) {
      const prompt = `Eres asistente de redacción técnica para presupuestos de servicios de mantenimiento, construcción civil y metalúrgica en Paraguay. Mejora y clarifica el siguiente título de sección de presupuesto.

REGLAS:
- Devuelve SOLO el texto mejorado, sin comillas, sin explicaciones, sin markdown
- Español profesional, claro y conciso
- Máximo 80 caracteres
- Mantén el significado original
- No inventes información técnica
${contexto ? `- Contexto del servicio: ${contexto}` : ''}

TEXTO A MEJORAR:
${texto}`;

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
            temperature: 0.4,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const resultado = data.choices?.[0]?.message?.content?.trim() ?? '';
          if (resultado) return NextResponse.json({ texto: resultado });
        }
      } catch { /* fall through to fallback */ }
    }

    // Fallback: mejora básica del texto sin IA
    return NextResponse.json({ texto: fallbackMejorar(texto) });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
