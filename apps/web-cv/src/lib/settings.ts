import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { settings } from '@/db/schema';

export const getSetting = (key: string): string | null =>
  getDb().select({ value: settings.value }).from(settings).where(eq(settings.key, key)).get()
    ?.value ?? null;

export const getAllSettings = (): Record<string, string> =>
  Object.fromEntries(
    getDb()
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .all()
      .map(({ key, value }) => [key, value]),
  );
