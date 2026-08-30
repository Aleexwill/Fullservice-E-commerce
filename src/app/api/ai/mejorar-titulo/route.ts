import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI no configurada' }, { status: 503 });
  }

  try {
    const { texto, contexto } = await request.json();
    if (!texto?.trim()) {
      return NextResponse.json({ error: 'Texto requerido' }, { status: 400 });
    }

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Eres asistente de redacción técnica para presupuestos de servicios de mantenimiento, construcción civil y metalúrgica en Paraguay. Tu tarea es mejorar y clarificar el texto de un título o descripción de sección de presupuesto.

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

    const resultado = (msg.content[0] as { text: string }).text.trim();
    return NextResponse.json({ texto: resultado });
  } catch (error) {
    console.error('Error AI mejorar-titulo:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
