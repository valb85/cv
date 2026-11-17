'use server';

import { and, eq, gt, lt, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDb } from '@/db/client';
import { blocks, cvDocument, messages, pages, settings, users } from '@/db/schema';
import { adminPath } from '@/lib/admin-path';
import { authenticate, clearSessionCookie, requireUser, setSessionCookie } from '@/lib/auth';
import { clientIp } from '@/lib/client-ip';
import { isBlockType, type BlockType } from '@/lib/blocks';
import { saveCvDocument } from '@/lib/cv';
import { parseCvExport, parseCvForm } from '@/lib/cv-document';
import { defaultBlockData, parseBlockForm } from '@/lib/block-forms';
import { clearLoginAttempts, loginLockout, recordFailedLogin } from '@/lib/login-throttle';
import { hashPassword } from '@/lib/password';

const str = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();
const num = (data: FormData, key: string): number => Number(data.get(key) ?? 0) || 0;
const bool = (data: FormData, key: string): boolean => data.get(key) === 'on';

const MIN_PASSWORD_LENGTH = 12;


// The client as our own proxies saw it. Reading the first X-Forwarded-For
// entry (or X-Real-IP) let a caller send its own value and dodge the lockout
// by changing it on every guess - see src/lib/client-ip.ts.
const clientKey = async (): Promise<string> => clientIp(await headers());

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

export const updateCv = async (_: string | null, data: FormData): Promise<string> => {
  await requireUser();

  const cv = parseCvForm(data);

  if (!cv.name) {
    return 'The name is required; nothing saved.';
  }

  saveCvDocument(cv);
  revalidatePath(adminPath('/cv'));

  return 'CV saved. The next download uses it.';
};

/**
 * Throws the saved CV away. Until the next save the editor and the PDF show a
 * fresh draft imported from the site's pages again.
 */
export const resetCv = async (): Promise<void> => {
  await requireUser();

  getDb().delete(cvDocument).run();

  revalidatePath(adminPath('/cv'));
  redirect(adminPath('/cv'));
};

const MAX_IMPORT_BYTES = 512 * 1024;

/**
 * Replaces the saved CV with an uploaded export (see /cv/export). The file is
 * validated field by field before anything is written; on any problem the
 * saved CV is left untouched and the reason is shown.
 */
export const importCv = async (_: string | null, data: FormData): Promise<string> => {
  await requireUser();

  const file = data.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return 'Choose a CV export (.json) to import.';
  }

  if (file.size > MAX_IMPORT_BYTES) {
    return 'That file is too large to be a CV export.';
  }

  let raw: unknown;

  try {
    raw = JSON.parse(await file.text());
  } catch {
    return 'That file is not valid JSON.';
  }

  const cv = parseCvExport(raw);

  if (typeof cv === 'string') {
    return `Nothing imported: ${cv}`;
  }

  saveCvDocument(cv);

  // The marker remounts the editor: its fields are uncontrolled, so a plain
  // re-render would keep showing the values from before the import.
  redirect(adminPath(`/cv?imported=${Date.now()}`));
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

/**
 * Empties the inbox - for clearing out a spam run. Bounded by the newest id
 * the page showed (`upToId`), so a message that arrives between loading the
 * page and confirming is kept rather than deleted unseen.
 */
export const deleteAllMessages = async (data: FormData): Promise<void> => {
  await requireUser();

  const upToId = num(data, 'upToId');

  if (upToId > 0) {
    getDb().delete(messages).where(lte(messages.id, upToId)).run();
  }

  revalidatePath(adminPath('/messages'));
  revalidatePath('/', 'layout');
};
