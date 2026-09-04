'use server';

import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb } from '@/db/client';
import { blocks, messages, pages, settings } from '@/db/schema';
import { authenticate, clearSessionCookie, requireUser, setSessionCookie } from '@/lib/auth';
import { isBlockType, type BlockType } from '@/lib/blocks';
import { defaultBlockData, parseBlockForm } from '@/lib/block-forms';

const str = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();
const num = (data: FormData, key: string): number => Number(data.get(key) ?? 0) || 0;
const bool = (data: FormData, key: string): boolean => data.get(key) === 'on';

export const login = async (_: string | null, data: FormData): Promise<string | null> => {
  const userId = authenticate(str(data, 'email'), String(data.get('password') ?? ''));

  if (!userId) {
    return 'Wrong e-mail or password.';
  }

  await setSessionCookie(userId);
  redirect('/admin');
};

export const logout = async (): Promise<void> => {
  await clearSessionCookie();
  redirect('/admin/login');
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
  redirect(`/admin/pages/${created.id}`);
};

export const updatePage = async (data: FormData): Promise<void> => {
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
};

export const deletePage = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb().delete(pages).where(eq(pages.id, num(data, 'id'))).run();

  revalidatePath('/', 'layout');
  redirect('/admin');
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

export const updateBlock = async (data: FormData): Promise<void> => {
  await requireUser();

  const id = num(data, 'id');
  const type = str(data, 'type');

  if (!isBlockType(type)) {
    return;
  }

  getDb()
    .update(blocks)
    .set({ data: parseBlockForm(type, data), column: num(data, 'column'), updatedAt: new Date() })
    .where(eq(blocks.id, id))
    .run();

  revalidatePath('/', 'layout');
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

export const updateSettings = async (data: FormData): Promise<void> => {
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
};

export const markMessageRead = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb()
    .update(messages)
    .set({ readAt: new Date() })
    .where(eq(messages.id, num(data, 'id')))
    .run();

  revalidatePath('/admin/messages');
};

export const deleteMessage = async (data: FormData): Promise<void> => {
  await requireUser();

  getDb().delete(messages).where(eq(messages.id, num(data, 'id'))).run();

  revalidatePath('/admin/messages');
};
