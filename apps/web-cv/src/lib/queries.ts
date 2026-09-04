import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import type { Block, Page } from '@/db/schema';
import { blocks, messages, pages } from '@/db/schema';
import type { TypedBlockFields } from '@/lib/blocks';

export type RenderableBlock = Omit<Block, 'type' | 'data'> & TypedBlockFields;

export type PageWithBlocks = {
  page: Page;
  blocks: RenderableBlock[];
};

export type NavEntry = {
  slug: string;
  label: string;
};

export const getNavEntries = (): NavEntry[] =>
  getDb()
    .select({ slug: pages.slug, navLabel: pages.navLabel, title: pages.title })
    .from(pages)
    .where(and(eq(pages.published, true), eq(pages.inMenu, true)))
    .orderBy(asc(pages.navOrder), asc(pages.id))
    .all()
    .map(({ slug, navLabel, title }) => ({ slug, label: navLabel ?? title }));

export const getPageWithBlocks = (slug: string): PageWithBlocks | null => {
  const db = getDb();

  const page = db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.published, true)))
    .get();

  if (!page) {
    return null;
  }

  const rows = db
    .select()
    .from(blocks)
    .where(eq(blocks.pageId, page.id))
    .orderBy(asc(blocks.position), asc(blocks.id))
    .all();

  // The type/data correlation cannot be expressed in the schema; this is the
  // single point where the stored JSON is trusted to match its type column.
  return { page, blocks: rows as RenderableBlock[] };
};

export const countPublishedPages = (): number =>
  getDb()
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(eq(pages.published, true))
    .get()?.count ?? 0;

export const countUnreadMessages = (): number =>
  getDb()
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(isNull(messages.readAt))
    .get()?.count ?? 0;
