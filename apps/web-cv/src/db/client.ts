import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

// Cached on globalThis so Next's dev hot-reload reuses one connection instead
// of opening a new handle on every module reload.
const globalForDb = globalThis as unknown as { __cvDb?: Db };

export const databasePath = (): string => process.env.DATABASE_PATH ?? './data/cv.db';

/**
 * Lazy on purpose. Connecting at module scope would open (and therefore
 * create) the database file during `next build`, baking an empty db into the
 * image - the exact failure the volume exists to prevent.
 */
export const getDb = (): Db => {
  if (globalForDb.__cvDb) {
    return globalForDb.__cvDb;
  }

  const sqlite = new Database(databasePath());
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  globalForDb.__cvDb = db;

  return db;
};
