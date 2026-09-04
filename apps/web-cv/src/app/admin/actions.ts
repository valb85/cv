'use server';

import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDb } from '@/db/client';
import { blocks, messages, pages, settings, users } from '@/db/schema';
import { adminPath } from '@/lib/admin-path';
import { authenticate, clearSessionCookie, requireUser, setSessionCookie } from '@/lib/auth';
import { isBlockType, type BlockType } from '@/lib/blocks';
import { defaultBlockData, parseBlockForm } from '@/lib/block-forms';
import { clearLoginAttempts, loginLockout, recordFailedLogin } from '@/lib/login-throttle';
import { hashPassword } from '@/lib/password';

const str = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();
const num = (data: FormData, key: string): number => Number(data.get(key) ?? 0) || 0;
const bool = (data: FormData, key: string): boolean => data.get(key) === 'on';

const MIN_PASSWORD_LENGTH = 12;

// Apache adds X-Forwarded-For on the way through, so this is the real client
// rather than 127.0.0.1 for every single request.
const clientKey = async (): Promise<string> => {
  const list = await headers();
  const forwarded = list.get('x-forwarded-for')?.split(',')[0]?.trim();

  return forwarded || list.get('x-real-ip') || 'unknown';
};

export const login = async (_: string | null, data: FormData): Promise<string | null> => {
  const key = await clientKey();
  const lockedFor = loginLockout(key);

  // Checked before the password is looked at, so a locked-out caller learns
  // nothing from how long the answer takes.
  if (lockedFor > 0) {
    return `Too many attempts. Try again in ${Math.ceil(lockedFor / 60)} minutes.`;
  }

  const userId = authenticate(str(data, 'email'), String(data.get('password') ?? ''));

  if (!userId) {
    recordFailedLogin(key);

    return 'Wrong e-mail or password.';
  }

  clearLoginAttempts(key);
  await setSessionCookie(userId);
  redirect(adminPath());
};

/**
 * ADMIN_PASSWORD only ever seeds the very first boot, so without this the
 * password set on day one is the password forever - and a database copied up
 * from a laptop brings that laptop's password with it.
 *
 * Existing sessions survive a change: the session token is signed over the
 * user id, not the password. They expire on their own within SESSION_TTL.
 */
export const changePassword = async (_: string | null, data: FormData): Promise<string | null> => {
  const user = await requireUser();

  const current = String(data.get('current_password') ?? '');
  const next = String(data.get('new_password') ?? '');

  if (!authenticate(user.email, current)) {
    return 'That is not your current password.';
  }

  if (next.length < MIN_PASSWORD_LENGTH) {
    return `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (next !== String(data.get('confirm_password') ?? '')) {
    return 'The two new passwords do not match.';
  }

  if (next === current) {
    return 'That is already your password.';
  }

  getDb().update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, user.id)).run();

  return 'Password changed.';
};

export const logout = async (): Promise<void> => {
  await clearSessionCookie();
  redirect(adminPath('/login'));
};

export const createPage = async (data: FormData): Promise<void> => {
  await requireUser();

  const slug = str(data, 'slug')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    return;
  }

  const maxOrder = getDb()
    .select({ max: sql<number>`coalesce(max(${pages.navOrder}), -1)` })
    .from(pages)
    .get();

  const created = getDb()
    .insert(pages)
    .values({
      slug,
      title: str(data, 'title') || slug,
      navLabel: str(data, 'title') || slug,
      navOrder: (maxOrder?.max ?? -1) + 1,
      inMenu: true,
      published: false,
    })
    .returning({ id: pages.id })
    .get();

  revalidatePath('/', 'layout');
  redirect(adminPath(`/pages/${created.id}`));
};

export const updatePage = async (_: string | null, data: FormData): Promise<string> => {
  await requireUser();

  const id = num(data, 'id');

  getDb()
    .update(pages)
    .set({
      slug: str(data, 'slug'),
      title: str(data, 'title'),
      navLabel: str(data, 'navLabel') || null,
      navIcon: str(data, 'navIcon') || null,
      navOrder: num(data, 'navOrder'),
      inMenu: bool(data, 'inMenu'),
      published: bool(data, 'published'),
      metaDescription: str(data, 'metaDescription') || null,
      columns: Math.min(3, Math.max(1, num(data, 'columns') || 1)),
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id))
    .run();

  revalidatePath('/', 'layout');

  return 'Page saved.';
};

export const deletePage = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb().delete(pages).where(eq(pages.id, num(data, 'id'))).run();

  revalidatePath('/', 'layout');
  redirect(adminPath());
};

export const addBlock = async (data: FormData): Promise<void> => {
  await requireUser();

  const pageId = num(data, 'pageId');
  const type = str(data, 'type');

  if (!isBlockType(type)) {
    return;
  }

  const maxPosition = getDb()
    .select({ max: sql<number>`coalesce(max(${blocks.position}), -1)` })
    .from(blocks)
    .where(eq(blocks.pageId, pageId))
    .get();

  getDb()
    .insert(blocks)
    .values({
      pageId,
      type: type as BlockType,
      position: (maxPosition?.max ?? -1) + 1,
      data: defaultBlockData(type),
    })
    .run();

  revalidatePath('/', 'layout');
};

export const updateBlock = async (_: string | null, data: FormData): Promise<string> => {
  await requireUser();

  const id = num(data, 'id');

  // The stored type decides how the form is parsed. Trusting the submitted
  // `type` lets a stale or mismatched form write the wrong shape into a block,
  // which then breaks its editor on the next render.
  const existing = getDb().select({ type: blocks.type }).from(blocks).where(eq(blocks.id, id)).get();

  if (!existing || !isBlockType(existing.type)) {
    return 'Block not found; nothing saved.';
  }

  const type = existing.type;

  getDb()
    .update(blocks)
    .set({ data: parseBlockForm(type, data), column: num(data, 'column'), updatedAt: new Date() })
    .where(eq(blocks.id, id))
    .run();

  revalidatePath('/', 'layout');

  return 'Block saved.';
};

export const deleteBlock = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb().delete(blocks).where(eq(blocks.id, num(data, 'id'))).run();

  revalidatePath('/', 'layout');
};

/** Swaps position with the adjacent block, so ordering stays gap-free. */
export const moveBlock = async (data: FormData): Promise<void> => {
  await requireUser();

  const db = getDb();
  const id = num(data, 'id');
  const up = str(data, 'direction') === 'up';

  const current = db.select().from(blocks).where(eq(blocks.id, id)).get();

  if (!current) {
    return;
  }

  const neighbour = db
    .select()
    .from(blocks)
    .where(
      and(
        eq(blocks.pageId, current.pageId),
        up ? lt(blocks.position, current.position) : gt(blocks.position, current.position),
      ),
    )
    .orderBy(up ? sql`${blocks.position} desc` : sql`${blocks.position} asc`)
    .get();

  if (!neighbour) {
    return;
  }

  db.update(blocks).set({ position: neighbour.position }).where(eq(blocks.id, current.id)).run();
  db.update(blocks).set({ position: current.position }).where(eq(blocks.id, neighbour.id)).run();

  revalidatePath('/', 'layout');
};

export const updateSettings = async (_: string | null, data: FormData): Promise<string> => {
  await requireUser();

  for (const [key, value] of data.entries()) {
    if (typeof value !== 'string') {
      continue;
    }

    getDb()
      .insert(settings)
      .values({ key, value: value.trim() })
      .onConflictDoUpdate({ target: settings.key, set: { value: value.trim() } })
      .run();
  }

  revalidatePath('/', 'layout');

  return 'Settings saved.';
};

export const markMessageRead = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb()
    .update(messages)
    .set({ readAt: new Date() })
    .where(eq(messages.id, num(data, 'id')))
    .run();

  revalidatePath(adminPath('/messages'));
};

export const deleteMessage = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb().delete(messages).where(eq(messages.id, num(data, 'id'))).run();

  revalidatePath(adminPath('/messages'));
};
