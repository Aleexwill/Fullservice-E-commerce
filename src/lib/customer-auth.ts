import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';

const encoder = new TextEncoder();
const COOKIE = 'fsc_customer_session';
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET no configurado');
  return s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Buffer.from(sig).toString('base64url');
}

export interface CustomerSession {
  customerId: string;
  email: string;
  name: string;
}

export async function createCustomerToken(customerId: string, email: string, name: string): Promise<string> {
  const payload = JSON.stringify({ id: customerId, e: email, n: name, exp: Date.now() + TTL_MS });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = await hmac(b64);
  return `${b64}.${sig}`;
}

export async function verifyCustomerToken(token: string | undefined | null): Promise<CustomerSession | null> {
  if (!token) return null;
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  const expected = await hmac(b64);
  if (expected !== sig) return null;
  try {
    const p = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8'));
    if (typeof p.exp !== 'number' || Date.now() > p.exp) return null;
    return { customerId: p.id, email: p.e, name: p.n };
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return verifyCustomerToken(token);
}

export async function requireCustomerAuth(): Promise<CustomerSession | NextResponse> {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return session;
}

export async function setCustomerCookie(token: string): Promise<void> {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL_MS / 1000,
    path: '/',
  });
}

export async function clearCustomerCookie(): Promise<void> {
  (await cookies()).set(COOKIE, '', { maxAge: 0, path: '/' });
}

// Genera token random de 32 bytes para activación/reset
export function generateToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

// Hash de contraseña usando PBKDF2
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Buffer.from(salt).toString('hex');
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  const hashHex = Buffer.from(bits).toString('hex');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key, 256
  );
  return Buffer.from(bits).toString('hex') === hashHex;
}

// Crea o recupera la CustomerAccount para un email (usado en checkout)
export async function findOrCreateCustomerByEmail(email: string, name: string, phone = ''): Promise<string> {
  const existing = await prisma.customerAccount.findUnique({ where: { email } });
  if (existing) return existing.id;
  const activationToken = generateToken();
  const account = await prisma.customerAccount.create({
    data: {
      email,
      name,
      phone,
      activationToken,
      activationExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48h
    },
  });
  // Send activation email asynchronously (fire and forget)
  import('@/lib/email').then(({ sendCustomerActivationEmail }) =>
    sendCustomerActivationEmail({ to: email, customerName: name, activationToken }).catch(() => null)
  ).catch(() => null);
  return account.id;
}
