import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'cv_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionPayload = { uid: number; exp: number };

const sessionSecret = (): string => {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short; refusing to issue sessions.');
  }

  return secret;
};

const sign = (payload: string): string =>
  createHmac('sha256', sessionSecret()).update(payload).digest('base64url');

export const createSessionToken = (userId: number): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: expiresAt })).toString('base64url');

  return `${payload}.${sign(payload)}`;
};

export const readSessionToken = (token: string | undefined): SessionPayload | null => {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload;

    return parsed.exp > Math.floor(Date.now() / 1000) ? parsed : null;
  } catch {
    return null;
  }
};
