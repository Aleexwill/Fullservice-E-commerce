import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Palabras que no se capitalizan (preposiciones/artículos en español)
const MINUSCULAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u', 'en', 'a', 'con', 'por', 'para', 'sin', 'al']);

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => (i === 0 || !MINUSCULAS.has(word)) ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

function fallbackMejorar(texto: string, contexto?: string): string {
  let result = texto.trim().replace(/\s+/g, ' ').replace(/\.+$/, '');

  // Expansiones de abreviaciones comunes en construcción/mantenimiento
  const expansiones: [RegExp, string][] = [
    [/\binst\b/gi, 'Instalación'],
    [/\bmant\b/gi, 'Mantenimiento'],
    [/\brep\b/gi, 'Reparación'],
    [/\bconst\b/gi, 'Construcción'],
    [/\belec\b/gi, 'Eléctrico'],
    [/\bsanitario\b/gi, 'Sanitario'],
    [/\bpintura\b/gi, 'Pintura'],
    [/\bestructura\b/gi, 'Estructura'],
    [/\bcivil\b/gi, 'Civil'],
  ];

  for (const [regex, reemplazo] of expansiones) {
    result = result.replace(regex, reemplazo);
  }

  return titleCase(result);
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
          if (resultado) return NextResponse.json({ texto: resultado, source: 'ai' });
        }
      } catch { /* fall through to fallback */ }
    }

    // Fallback inteligente sin API
    return NextResponse.json({ texto: fallbackMejorar(texto, contexto), source: 'template' });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
