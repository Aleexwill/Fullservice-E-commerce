import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MINUSCULAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u', 'en', 'a', 'con', 'por', 'para', 'sin', 'al']);

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => (i === 0 || !MINUSCULAS.has(word)) ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}

function corregirTexto(texto: string): string {
  let result = texto.trim().replace(/\s+/g, ' ').replace(/\.+$/, '');

  const expansiones: [RegExp, string][] = [
    [/\binst(?:al)?\b/gi, 'Instalación'],
    [/\bmant(?:en)?\b/gi, 'Mantenimiento'],
    [/\brep(?:ar)?\b/gi, 'Reparación'],
    [/\bconst(?:r)?\b/gi, 'Construcción'],
    [/\belec(?:tr)?\b/gi, 'Eléctrico'],
    [/\bdemol\b/gi, 'Demolición'],
    [/\bimpermeab\b/gi, 'Impermeabilización'],
    [/\bplom\b/gi, 'Plomería'],
    [/\bsanit\b/gi, 'Sanitario'],
    [/\bmetalurg\b/gi, 'Metalúrgica'],
    [/\blimpiez\b/gi, 'Limpieza'],
    [/\bpint\b/gi, 'Pintura'],
    [/\bcarpint\b/gi, 'Carpintería'],
    [/\brefacc\b/gi, 'Refacción'],
    [/\bprev\b/gi, 'Preventivo'],
    [/\bcorrect\b/gi, 'Correctivo'],
    [/\bsold(?:adura)?\b/gi, 'Soldadura'],
    [/\bestruc\b/gi, 'Estructura'],
    [/\bcielo raso\b/gi, 'Cielorraso'],
    [/\bcielo rraso\b/gi, 'Cielorraso'],
  ];

  for (const [regex, reemplazo] of expansiones) {
    result = result.replace(regex, reemplazo);
  }

  return titleCase(result);
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
  sold: 'Comprende trabajos de soldadura MIG/MAG, TIG o electrodo según requerimiento, con control de calidad de juntas.',
  plomer: 'Incluye suministro e instalación de cañerías, accesorios y válvulas para instalaciones sanitarias y de agua.',
};

function fallbackAlcance(texto: string, contexto?: string): string {
  const lower = texto.toLowerCase();
  for (const [key, alcance] of Object.entries(ALCANCES)) {
    if (lower.includes(key)) return alcance;
  }
  const base = contexto ? `servicio de ${contexto.toLowerCase()}` : 'esta sección';
  return `Comprende todos los trabajos, materiales y mano de obra necesarios para la correcta ejecución del ${base}, conforme a especificaciones acordadas con el cliente.`;
}

export async function POST(request: NextRequest) {
  try {
    const { texto, contexto } = await request.json();
    if (!texto?.trim()) return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });

    if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
      const prompt = `Eres un asistente especializado en redacción técnica para presupuestos de servicios de construcción, mantenimiento, metalúrgica y limpieza industrial en Paraguay.

Dado el texto de una sección de presupuesto (puede tener abreviaturas, errores ortográficos o redacción informal), devuelve un JSON con exactamente estos campos:

- "corregido": Corrige ortografía, gramática y puntuación. Expande abreviaturas (ej: "inst" → "Instalación", "mant" → "Mantenimiento"). Mantiene el significado original sin agregar contenido nuevo. Aplica Title Case. Máx 100 caracteres.
- "mejorado": Versión profesional y técnica del mismo texto. Usa terminología del rubro (construcción, mantenimiento, metalúrgica). Puede ser más descriptiva pero concisa. Sin jerga coloquial. Máx 120 caracteres.
- "alcance": Descripción del alcance de trabajos de esa sección (2-3 oraciones, tercera persona, tono contractual/técnico, máx 250 caracteres).

${contexto ? `Contexto del presupuesto: ${contexto}` : ''}

TEXTO: ${texto}

Responde SOLO el JSON sin markdown ni explicaciones.`;

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 400,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const parsed = JSON.parse(raw);
          if (parsed.corregido || parsed.mejorado) {
            return NextResponse.json({
              corregido: parsed.corregido ?? corregirTexto(texto),
              titulo: parsed.mejorado ?? parsed.corregido ?? corregirTexto(texto),
              alcance: parsed.alcance ?? fallbackAlcance(texto, contexto),
              source: 'ai',
            });
          }
        }
      } catch { /* fall through to fallback */ }
    }

    // Fallback sin API
    return NextResponse.json({
      corregido: corregirTexto(texto),
      titulo: corregirTexto(texto),
      alcance: fallbackAlcance(texto, contexto),
      source: 'template',
    });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
