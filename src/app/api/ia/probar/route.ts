import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getGeminiModel, GEMINI_MODEL_ID } from '@/lib/gemini';
import { medirIA } from '@/lib/ia/uso';
import { estadoProveedores } from '@/lib/ia/estadisticas';
import Anthropic from '@anthropic-ai/sdk';

/** Hace una llamada mínima al proveedor para comprobar que la clave y el modelo funcionan. Cuenta como consumo (función "prueba"). */
export async function POST(request: NextRequest) {
  const a = await requireRole('canManageConfig');
  if (a instanceof NextResponse) return a;
  if (!rateLimit(`ia-probar:${a.username}`, 6, 60_000).allowed) return NextResponse.json({ error: 'Esperá un minuto antes de probar de nuevo' }, { status: 429 });
  const { proveedor } = await request.json().catch(() => ({ proveedor: '' }));
  const est = estadoProveedores().find(p => p.id === proveedor);
  if (!est) return NextResponse.json({ error: 'Proveedor inválido' }, { status: 400 });
  if (!est.configurado) return NextResponse.json({ ok: false, error: 'La clave no está configurada en el servidor.' });
  const t0 = Date.now();
  try {
    if (proveedor === 'gemini') {
      const modelo = GEMINI_MODEL_ID;
      await medirIA({ funcion: 'prueba', proveedor: 'gemini', modelo, session: a }, async () => {
        const r = await getGeminiModel(process.env.GEMINI_API_KEY!).generateContent('Respondé solo: ok');
        return { valor: r.response.text(), tokensEntrada: r.response.usageMetadata?.promptTokenCount, tokensSalida: r.response.usageMetadata?.candidatesTokenCount };
      });
    } else if (proveedor === 'anthropic') {
      await medirIA({ funcion: 'prueba', proveedor: 'anthropic', modelo: est.modelo, session: a }, async () => {
        const m = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({ model: est.modelo, max_tokens: 10, messages: [{ role: 'user', content: 'Respondé solo: ok' }] });
        return { valor: m, tokensEntrada: m.usage.input_tokens, tokensSalida: m.usage.output_tokens };
      });
    } else {
      await medirIA({ funcion: 'prueba', proveedor: 'openai', modelo: est.modelo, session: a }, async () => {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: est.modelo, max_tokens: 10, messages: [{ role: 'user', content: 'Respondé solo: ok' }] }),
        });
        if (!res.ok) throw new Error(`OpenAI respondió ${res.status}`);
        const d = await res.json();
        return { valor: d, tokensEntrada: d.usage?.prompt_tokens, tokensSalida: d.usage?.completion_tokens };
      });
    }
    return NextResponse.json({ ok: true, ms: Date.now() - t0 });
  } catch (e) {
    const msg = (e instanceof Error ? e.message : 'Error').replace(/key=[^&\s"']+/gi, 'key=***').replace(/(sk-|AIza)[\w-]{6,}/g, '***').slice(0, 200);
    return NextResponse.json({ ok: false, ms: Date.now() - t0, error: msg });
  }
}
