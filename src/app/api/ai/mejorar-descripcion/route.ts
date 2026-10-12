import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIp } from '@/lib/rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/* ─────────────────────────────────────────
   System prompt — updated for vision
   ───────────────────────────────────────── */
const SYSTEM_PROMPT = `Eres un redactor experto en e-commerce especializado en ferretería, construcción, herramientas industriales y materiales de obra para Paraguay y Latinoamérica.

Cuando se te proporciona una imagen del producto, ANALÍZALA DETALLADAMENTE y extrae:
- Color, acabado y materiales visibles
- Dimensiones o potencia/voltaje que aparezcan en el packaging o en el producto
- Accesorios o componentes incluidos que puedas ver
- Certificaciones o logos visibles (CE, UL, etc.)
- Cualquier característica técnica legible en etiquetas o packaging

REGLAS:
- Escribe SIEMPRE en español (Paraguay/Latinoamérica)
- Tono profesional pero accesible, técnico cuando corresponde
- Resalta beneficios sobre características
- Incluye usos prácticos y aplicaciones reales
- Usa palabras clave naturales para SEO
- NO uses emojis
- NO inventes especificaciones que no hayas visto en la imagen o que no te hayan dado
- Si no tienes datos suficientes, trabaja con lo que tienes sin inventar

FORMATO DE RESPUESTA (JSON estricto, sin markdown):
{
  "shortDescription": "Descripción corta optimizada (máx 155 caracteres, ideal para SEO meta description y listados)",
  "description": "Descripción completa de 3-5 párrafos. Primer párrafo: beneficio principal y uso. Segundo párrafo: características clave (incluyendo las extraídas de la imagen). Tercer párrafo: aplicaciones y para quién es. Separar párrafos con doble salto de línea.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

/* ─────────────────────────────────────────
   Text prompt builder
   ───────────────────────────────────────── */
function buildUserPrompt(data: {
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  tags: string[];
  price: string;
  hasImage: boolean;
}): string {
  let prompt = data.hasImage
    ? `Analiza la imagen del producto y los datos a continuación para generar descripciones optimizadas:\n\n`
    : `Genera descripciones optimizadas para este producto:\n\n`;

  prompt += `PRODUCTO: ${data.name}\n`;
  if (data.brand) prompt += `MARCA: ${data.brand}\n`;
  if (data.category) prompt += `CATEGORÍA: ${data.category}\n`;
  if (data.price) prompt += `PRECIO: Gs. ${Number(data.price).toLocaleString('es-PY')}\n`;

  if (data.shortDescription) {
    prompt += `\nDESCRIPCIÓN ACTUAL (mejorar esta):\n${data.shortDescription}\n`;
  }
  if (data.description) {
    prompt += `\nDESCRIPCIÓN LARGA ACTUAL:\n${data.description}\n`;
  }
  if (data.specifications && Object.keys(data.specifications).length > 0) {
    prompt += `\nESPECIFICACIONES TÉCNICAS:\n`;
    for (const [key, val] of Object.entries(data.specifications)) {
      prompt += `- ${key}: ${val}\n`;
    }
  }
  if (data.tags && data.tags.length > 0) {
    prompt += `\nETIQUETAS ACTUALES: ${data.tags.join(', ')}\n`;
  }

  if (data.hasImage) {
    prompt += `\nExtrae las características visibles en la imagen e inclúyelas en la descripción. Genera el JSON con shortDescription, description y tags.`;
  } else {
    prompt += `\nGenera el JSON con shortDescription, description y tags mejorados.`;
  }

  return prompt;
}

/* ─────────────────────────────────────────
   Template fallback (no API key)
   ───────────────────────────────────────── */
function generateFallbackDescription(data: {
  name: string; brand: string; category: string;
  shortDescription: string; description: string;
  specifications: Record<string, string>; tags: string[];
}) {
  const brandText = data.brand ? ` ${data.brand}` : '';
  const catText = data.category || 'ferretería';

  const shortParts = [data.shortDescription ? data.shortDescription.replace(/\.+$/, '') : `${data.name}${brandText}`];
  if (data.brand && !shortParts[0].includes(data.brand)) shortParts[0] += ` de ${data.brand}`;
  const shortDescription = (shortParts[0] + '. Calidad profesional con garantía. Envío a todo el país.').slice(0, 155);

  const specsEntries = Object.entries(data.specifications || {});
  const specsText = specsEntries.length > 0
    ? `Especificaciones principales: ${specsEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}.`
    : '';

  const descParagraphs = [
    `${data.name}${brandText} — la solución profesional para tus proyectos de ${catText.toLowerCase()}.`,
    specsText
      ? `Cuenta con características técnicas destacadas. ${specsText}`
      : `Fabricado con materiales de primera calidad y acabados industriales.`,
    `Ideal para profesionales de la construcción, mantenimiento industrial y talleres.`,
  ];
  if (data.description) descParagraphs[0] = data.description.split('\n')[0] || descParagraphs[0];

  const baseTags = [data.name.split(' ')[0]?.toLowerCase(), data.brand?.toLowerCase(), data.category?.toLowerCase(), 'profesional', 'calidad'].filter(Boolean);
  const allTags = [...new Set([...(data.tags || []), ...baseTags])].slice(0, 8);

  return { shortDescription, description: descParagraphs.join('\n\n'), tags: allTags, source: 'template' as const };
}

/* ─────────────────────────────────────────
   Parse AI JSON response (both providers)
   ───────────────────────────────────────── */
function parseAIJson(text: string) {
  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(clean);
}

/* ─────────────────────────────────────────
   POST handler
   ───────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const rl = rateLimit(`ai-desc:${getIp(request)}`, 10, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes, esperá un minuto' }, { status: 429 });
  }

  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio para generar descripciones' },
        { status: 400 }
      );
    }

    const images: string[] = body.images ?? [];
    const primaryImage = images[0] ?? null;
    const hasImage = !!primaryImage;

    /* ── 1. Anthropic Claude (vision when image available) ── */
    if (ANTHROPIC_API_KEY) {
      try {
        const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

        const userContent: Anthropic.MessageParam['content'] = [];

        if (hasImage) {
          userContent.push({
            type: 'image',
            source: { type: 'url', url: primaryImage },
          } as Anthropic.ImageBlockParam);
        }

        userContent.push({
          type: 'text',
          text: buildUserPrompt({ ...body, hasImage }),
        });

        const msg = await client.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        });

        const text = (msg.content[0] as Anthropic.TextBlock).text;
        const parsed = parseAIJson(text);

        return NextResponse.json({
          shortDescription: parsed.shortDescription || '',
          description: parsed.description || '',
          tags: parsed.tags || [],
          source: hasImage ? 'ai-vision' : 'ai',
        });
      } catch (err) {
        console.error('Anthropic API error, falling back:', err);
      }
    }

    /* ── 2. OpenAI fallback (text only) ── */
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-YOUR-KEY-HERE') {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: buildUserPrompt({ ...body, hasImage: false }) },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
          }),
        });

        if (!openaiRes.ok) throw new Error('OpenAI API error');

        const aiData = await openaiRes.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (!content) throw new Error('No content from AI');

        const parsed = parseAIJson(content);
        return NextResponse.json({
          shortDescription: parsed.shortDescription || '',
          description: parsed.description || '',
          tags: parsed.tags || [],
          source: 'ai',
        });
      } catch (err) {
        console.error('OpenAI API error, using template fallback:', err);
      }
    }

    /* ── 3. Template fallback ── */
    return NextResponse.json(generateFallbackDescription(body));

  } catch {
    return NextResponse.json({ error: 'Error al generar descripciones' }, { status: 500 });
  }
}
