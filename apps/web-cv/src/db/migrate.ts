import path from 'node:path';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { databasePath, getDb } from './client';

export const runMigrations = (): void => {
  const folder = path.join(process.cwd(), 'drizzle');

  migrate(getDb(), { migrationsFolder: folder });
  console.log(`[db] migrations applied to ${databasePath()}`);
};
