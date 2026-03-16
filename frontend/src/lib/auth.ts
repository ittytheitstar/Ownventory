import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE = 'ownventory_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  userId: string;
  role: 'OWNER' | 'VIEWER';
  exp: number;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'development-auth-secret';
}

function signValue(value: string) {
  return createHmac('sha256', getAuthSecret()).update(value).digest('hex');
}

function encodeSession(payload: SessionPayload) {
  const value = `${payload.userId}.${payload.role}.${payload.exp}`;
  return `${value}.${signValue(value)}`;
}

function decodeSession(token?: string | null): SessionPayload | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [userId, role, expRaw, signature] = parts;
  const value = `${userId}.${role}.${expRaw}`;
  const expectedSignature = signValue(value);

  if (
    signature.length !== expectedSignature.length
    || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  if (role !== 'OWNER' && role !== 'VIEWER') return null;

  return { userId, role, exp };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) return false;

  const computed = scryptSync(password, salt, 64).toString('hex');
  if (computed.length !== expectedHash.length) return false;

  return timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const payload = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) return null;
  return user;
}

export async function setSessionCookie(user: { id: string; role: 'OWNER' | 'VIEWER' }) {
  const cookieStore = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  cookieStore.set(SESSION_COOKIE, encodeSession({ userId: user.id, role: user.role, exp }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hasUsers() {
  const count = await prisma.user.count();
  return count > 0;
}
