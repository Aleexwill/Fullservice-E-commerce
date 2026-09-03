import type { Role } from './roles';

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no está configurado');
  return secret;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Buffer.from(sig).toString('base64url');
}

export const SESSION_COOKIE = 'fsc_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export interface SessionPayload {
  username: string;
  userId?: string;
  role: Role;
}

export async function createSessionToken(username: string, role: Role = 'admin', userId?: string): Promise<string> {
  const payload = JSON.stringify({ u: username, r: role, uid: userId, exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;

  const expectedSig = await hmac(payloadB64);
  if (expectedSig !== sig) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    return { username: payload.u, role: payload.r ?? 'admin', userId: payload.uid };
  } catch {
    return null;
  }
}
