import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { BlockData, BlockType } from '@/lib/blocks';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
};

/**
 * A page is also a menu entry: `inMenu` + `navOrder` are the whole navigation
 * model, so adding a page and adding its link are the same insert.
 */
export const pages = sqliteTable(
  'pages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    navLabel: text('nav_label'),
    navOrder: integer('nav_order').notNull().default(0),
    inMenu: integer('in_menu', { mode: 'boolean' }).notNull().default(true),
    published: integer('published', { mode: 'boolean' }).notNull().default(false),
    metaDescription: text('meta_description'),
    ...timestamps,
  },
  (table) => [index('pages_nav_idx').on(table.inMenu, table.navOrder)],
);

export const blocks = sqliteTable(
  'blocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pageId: integer('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    type: text('type').$type<BlockType>().notNull(),
    position: integer('position').notNull().default(0),
    data: text('data', { mode: 'json' }).$type<BlockData>().notNull(),
    ...timestamps,
  },
  (table) => [index('blocks_page_position_idx').on(table.pageId, table.position)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Submissions are stored before the email is attempted, so a broken SMTP relay
 * loses nothing - the old send.php dropped them silently.
 */
export const messages = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    body: text('body').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
    deliveryError: text('delivery_error'),
    readAt: integer('read_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('messages_created_idx').on(table.createdAt)],
);

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  ...timestamps,
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type User = typeof users.$inferSelect;
