import { eq } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';

import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/password';
import {
  createSessionToken,
  readSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from '@/lib/session';

export type SessionUser = { id: number; email: string };

/**
 * Driven by the actual request scheme, not BASE_URL. The site is reachable
 * both over https through Caddy and over plain http on the container port; a
 * cookie marked secure from an http request would simply never come back.
 */
const isSecureRequest = async (): Promise<boolean> =>
  (await headers()).get('x-forwarded-proto') === 'https';

export const setSessionCookie = async (userId: number): Promise<void> => {
  const store = await cookies();

  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isSecureRequest(),
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const clearSessionCookie = async (): Promise<void> => {
  (await cookies()).delete(SESSION_COOKIE);
};

export const getCurrentUser = async (): Promise<SessionUser | null> => {
  const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);

  if (!session) {
    return null;
  }

  return (
    getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, session.uid))
      .get() ?? null
  );
};

/**
 * Every server action calls this independently. The layout guard stops a
 * browser reaching the pages; it does nothing to stop a direct POST.
 */
export const requireUser = async (): Promise<SessionUser> => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  return user;
};

export const authenticate = (email: string, password: string): number | null => {
  const user = getDb().select().from(users).where(eq(users.email, email)).get();

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user.id;
};
