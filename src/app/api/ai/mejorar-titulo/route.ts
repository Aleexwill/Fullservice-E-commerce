import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const MINUSCULAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'o', 'u', 'en', 'a', 'con', 'por', 'para', 'sin', 'al']);

function titleCase(str: string): string {
  return str.toLowerCase().split(' ').map((word, i) =>
    (i === 0 || !MINUSCULAS.has(word)) ? word.charAt(0).toUpperCase() + word.slice(1) : word
  ).join(' ');
}

function corregirTexto(texto: string): string {
  let result = texto.trim().replace(/\s+/g, ' ').replace(/\.+$/, '');
  const expansiones: [RegExp, string][] = [
    [/\binst(?:al)?\b/gi, 'Instalación'], [/\bmant(?:en)?\b/gi, 'Mantenimiento'],
    [/\brep(?:ar)?\b/gi, 'Reparación'], [/\bconst(?:r)?\b/gi, 'Construcción'],
    [/\belec(?:tr)?\b/gi, 'Eléctrico'], [/\bdemol\b/gi, 'Demolición'],
    [/\bimpermeab\b/gi, 'Impermeabilización'], [/\bplom\b/gi, 'Plomería'],
    [/\bsanit\b/gi, 'Sanitario'], [/\bmetalurg\b/gi, 'Metalúrgica'],
    [/\blimpiez\b/gi, 'Limpieza'], [/\bpint\b/gi, 'Pintura'],
    [/\bcarpint\b/gi, 'Carpintería'], [/\brefacc\b/gi, 'Refacción'],
    [/\bprev\b/gi, 'Preventivo'], [/\bcorrect\b/gi, 'Correctivo'],
    [/\bsold(?:adura)?\b/gi, 'Soldadura'], [/\bestruc\b/gi, 'Estructura'],
    [/\bcielo raso\b/gi, 'Cielorraso'], [/\bcielo rraso\b/gi, 'Cielorraso'],
  ];
  for (const [regex, reemplazo] of expansiones) result = result.replace(regex, reemplazo);
  return titleCase(result);
}

const ALCANCES: Record<string, string> = {
  electric: 'Comprende los trabajos eléctricos necesarios conforme al relevamiento y a las especificaciones del proyecto.',
  sanitari: 'Incluye los trabajos sanitarios y de plomería necesarios conforme al relevamiento y a las especificaciones del proyecto.',
  pintura: 'Abarca la preparación de superficies y los trabajos de pintura indicados en el presupuesto.',
  estructura: 'Comprende la ejecución y/o montaje de los elementos estructurales detallados en el presupuesto.',
  civil: 'Incluye los trabajos de construcción civil detallados en la sección y sus terminaciones correspondientes.',
  mant: 'Comprende la revisión y los trabajos de mantenimiento detallados para restablecer o conservar el correcto funcionamiento.',
  inst: 'Incluye el montaje e instalación de los elementos expresamente detallados en el presupuesto.',
  demolic: 'Comprende los trabajos de demolición y retiro expresamente detallados en el presupuesto.',
  impermeabil: 'Incluye la preparación de la superficie y los trabajos de impermeabilización indicados en el presupuesto.',
  metalurg: 'Comprende los trabajos metalúrgicos detallados en la sección conforme a las especificaciones del proyecto.',
  limpieza: 'Incluye los trabajos de limpieza y acondicionamiento expresamente detallados en el presupuesto.',
  sold: 'Comprende los trabajos de soldadura indicados en la sección conforme al requerimiento técnico.',
  plomer: 'Incluye los trabajos de plomería expresamente detallados en el presupuesto.',
};

function fallbackAlcance(texto: string, contexto?: string): string {
  const lower = texto.toLowerCase();
  for (const [key, alcance] of Object.entries(ALCANCES)) if (lower.includes(key)) return alcance;
  const base = contexto ? `servicio de ${contexto.toLowerCase()}` : 'esta sección';
  return `Comprende los trabajos expresamente detallados para la correcta ejecución del ${base}, conforme al relevamiento y a las especificaciones acordadas.`;
}

type ContextItem = { tipo?: string; descripcion?: string; unidad?: string; cantidad?: number };

function sanitizeItems(items: unknown): ContextItem[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 20).map((item) => {
    const i = (item || {}) as ContextItem;
    return {
      tipo: String(i.tipo || '').slice(0, 30),
      descripcion: String(i.descripcion || '').slice(0, 180),
      unidad: String(i.unidad || '').slice(0, 30),
      cantidad: Number.isFinite(Number(i.cantidad)) ? Number(i.cantidad) : undefined,
    };
  }).filter((i) => i.descripcion);
}

export async function GET() {
  const hasKey = !!(GEMINI_API_KEY && GEMINI_API_KEY.length > 10);
  return NextResponse.json({ ok: hasKey, reason: hasKey ? undefined : 'GEMINI_API_KEY not set', model: GEMINI_MODEL });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const texto = String(body.texto || '').trim();
    const contexto = String(body.contexto || '').trim();
    const descripcionPresupuesto = String(body.descripcionPresupuesto || '').trim().slice(0, 800);
    const ubicacion = String(body.ubicacion || '').trim().slice(0, 180);
    const items = sanitizeItems(body.itemsSeccion);

    if (!texto) return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });

    if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
      const detalleItems = items.length
        ? items.map((i, idx) => `${idx + 1}. [${i.tipo || 'ítem'}] ${i.descripcion}${i.cantidad ? ` — ${i.cantidad} ${i.unidad || ''}` : ''}`).join('\n')
        : 'No hay ítems cargados en la sección.';

      const prompt = `Eres un asistente especializado en redacción técnica de presupuestos para construcción, mantenimiento, metalúrgica y servicios industriales en Paraguay.

Tu tarea es mejorar el título de una sección y proponer su alcance SIN inventar trabajos, materiales, cantidades, normas, garantías, métodos o equipos que no estén respaldados por el texto o los ítems suministrados.

Devuelve JSON con exactamente estos campos:
- "corregido": corrección ortográfica y gramatical del texto original, conservando su significado. Español natural; no uses Title Case inglés. Máximo 100 caracteres.
- "mejorado": título profesional y técnico, claro para el cliente. Puede reorganizar el texto y usar terminología técnica, pero no agregar trabajos inexistentes. Máximo 120 caracteres.
- "alcance": alcance contractual breve de 1 a 2 oraciones. Debe basarse únicamente en el título y los ítems de la sección. Si faltan datos, usar expresiones prudentes como "según detalle del presupuesto". Máximo 300 caracteres.
- "confianza": uno de "alta", "media" o "baja". Baja si el texto es ambiguo o hay muy poco contexto.
- "advertencia": cadena vacía si la propuesta es segura; si hay ambigüedad, explicar brevemente qué dato convendría confirmar.

Reglas de estilo:
- Español profesional utilizado en Paraguay.
- Preferir "provisión e instalación" solo cuando los ítems indiquen materiales/provisión; de lo contrario usar "instalación" o "trabajos de".
- No mencionar normas técnicas, marcas, garantías ni materiales no presentes.
- No convertir el alcance en una lista de supuestos.

Servicio general: ${contexto || 'No informado'}
Descripción general: ${descripcionPresupuesto || 'No informada'}
Ubicación/proyecto: ${ubicacion || 'No informada'}
Título original: ${texto}
Ítems pertenecientes a esta sección:
${detalleItems}

Responde SOLO JSON.`;

      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 500, responseMimeType: 'application/json' },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          try {
            const parsed = JSON.parse(raw);
            if (parsed.corregido || parsed.mejorado) {
              return NextResponse.json({
                corregido: parsed.corregido ?? corregirTexto(texto),
                titulo: parsed.mejorado ?? parsed.corregido ?? corregirTexto(texto),
                alcance: parsed.alcance ?? fallbackAlcance(texto, contexto),
                confianza: ['alta', 'media', 'baja'].includes(parsed.confianza) ? parsed.confianza : 'media',
                advertencia: String(parsed.advertencia || ''),
                source: 'gemini',
              });
            }
          } catch { console.error('Gemini JSON parse error'); }
        } else console.error(`Gemini API error ${res.status}`);
      } catch (fetchErr) { console.error('Gemini fetch error:', fetchErr); }
    }

    return NextResponse.json({
      corregido: corregirTexto(texto), titulo: corregirTexto(texto),
      alcance: fallbackAlcance(texto, contexto), confianza: items.length ? 'media' : 'baja',
      advertencia: items.length ? '' : 'No hay ítems de la sección para validar el alcance sugerido.', source: 'template',
    });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
