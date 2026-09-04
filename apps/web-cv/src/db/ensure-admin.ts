import { sql } from 'drizzle-orm';

import { hashPassword } from '../lib/password.ts';
import { getDb } from './client.ts';
import { users } from './schema.ts';

/**
 * Creates the single admin account on first boot. Never updates an existing
 * one - rotating the env var must not silently reset a password that has been
 * changed, and an empty ADMIN_PASSWORD must not create a login.
 */
export const ensureAdminUser = (): void => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const existing = getDb()
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .get();

  if ((existing?.count ?? 0) > 0) {
    return;
  }

  if (!email || !password) {
    console.warn('[auth] no admin user and ADMIN_EMAIL/ADMIN_PASSWORD unset; admin is locked out.');
    return;
  }

  getDb().insert(users).values({ email, passwordHash: hashPassword(password) }).run();
  console.log(`[auth] created admin user ${email}`);
};
