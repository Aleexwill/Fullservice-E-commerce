import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MINUSCULAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u', 'en', 'a', 'con', 'por', 'para', 'sin', 'al']);

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => (i === 0 || !MINUSCULAS.has(word)) ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

const ALCANCES: Record<string, string> = {
  electric: 'Comprende el suministro e instalación de materiales eléctricos, cableado, tableros y accesorios conforme a normas vigentes.',
  sanitari: 'Incluye trabajos de plomería, instalación de cañerías, accesorios sanitarios y conexiones de agua fría/caliente.',
  pintura: 'Abarca preparación de superficies, aplicación de fondo y pintura de terminación en paredes, cielorrasos y/o carpintería.',
  estructura: 'Comprende trabajos de hormigón armado, montaje de estructuras metálicas y/o carpintería según especificaciones.',
  civil: 'Incluye trabajos de mampostería, revoques, contrapisos y terminaciones según planos y especificaciones técnicas.',
  mant: 'Comprende revisión, ajuste, lubricación y/o reemplazo de componentes para garantizar el correcto funcionamiento del sistema.',
  inst: 'Incluye el suministro, montaje y conexión de equipos y/o materiales conforme a especificaciones técnicas del fabricante.',
  demolic: 'Comprende demolición controlada, retiro de escombros y disposición final de residuos según normativa vigente.',
  impermeabil: 'Incluye preparación de superficie, aplicación de membrana y/o productos impermeabilizantes con garantía de estanqueidad.',
  metalurg: 'Comprende trabajos de soldadura, corte, doblez y/o montaje de estructuras y elementos metálicos según diseño.',
  limpieza: 'Incluye limpieza profunda, desinfección y/o mantenimiento de espacios con productos y equipos especializados.',
};

function fallbackAlcance(texto: string, contexto?: string): string {
  const lower = texto.toLowerCase();
  for (const [key, alcance] of Object.entries(ALCANCES)) {
    if (lower.includes(key)) return alcance;
  }
  const base = contexto ? `servicio de ${contexto.toLowerCase()}` : 'esta sección';
  return `Comprende todos los trabajos, materiales y mano de obra necesarios para la correcta ejecución del ${base}, conforme a especificaciones acordadas con el cliente.`;
}

function fallbackMejorar(texto: string): string {
  let result = texto.trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
  const expansiones: [RegExp, string][] = [
    [/\binst\b/gi, 'Instalación'], [/\bmant\b/gi, 'Mantenimiento'],
    [/\brep\b/gi, 'Reparación'], [/\bconst\b/gi, 'Construcción'],
    [/\belec\b/gi, 'Eléctrico'], [/\bdemol\b/gi, 'Demolición'],
    [/\bimpermeab\b/gi, 'Impermeabilización'],
  ];
  for (const [regex, reemplazo] of expansiones) result = result.replace(regex, reemplazo);
  return titleCase(result);
}

export async function POST(request: NextRequest) {
  try {
    const { texto, contexto } = await request.json();
    if (!texto?.trim()) return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });

    if (OPENAI_API_KEY && OPENAI_API_KEY.length > 10) {
      const prompt = `Eres asistente de redacción técnica para presupuestos de servicios en Paraguay (mantenimiento, construcción civil, metalúrgica, limpieza).

Dado el título de una sección de presupuesto, devuelve un JSON con:
- "titulo": título mejorado (máx 80 caracteres, profesional, sin comillas)
- "alcance": descripción breve del alcance de trabajos de esa sección (1-2 oraciones, máx 200 caracteres, tercera persona, sin comillas)

${contexto ? `Contexto del servicio: ${contexto}` : ''}

TÍTULO: ${texto}

Responde SOLO el JSON, sin markdown.`;

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.4,
            response_format: { type: 'json_object' },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
          if (parsed.titulo) return NextResponse.json({ titulo: parsed.titulo, alcance: parsed.alcance ?? '', source: 'ai' });
        }
      } catch { /* fall through */ }
    }

    return NextResponse.json({
      titulo: fallbackMejorar(texto),
      alcance: fallbackAlcance(texto, contexto),
      source: 'template',
    });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
