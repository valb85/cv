/**
 * Runs once per server start, in dev and in the standalone production server
 * alike. Migrating here rather than from a separate script keeps the migrator
 * inside Next's dependency trace, so it survives the standalone build.
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { runMigrations } = await import('./db/migrate');
  const { ensureAdminUser } = await import('./db/ensure-admin');

  runMigrations();
  ensureAdminUser();
};
