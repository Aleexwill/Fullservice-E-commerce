import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const MODEL = 'gemini-3.6-flash';

export function getGeminiModel(apiKey: string, systemInstruction?: string): GenerativeModel {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL, systemInstruction });
}

export async function generateWithRetry(
  model: GenerativeModel,
  parts: any,
  maxRetries = 3,
): Promise<string> {
  let lastErr: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (err: any) {
      lastErr = err;
      const is503 = err?.message?.includes('503') || err?.status === 503;
      if (!is503 || i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}
