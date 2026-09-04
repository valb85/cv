import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { addBlock, deleteBlock, deletePage, moveBlock, updateBlock, updatePage } from '@/app/admin/actions';
import { BlockFields } from '@/components/admin/BlockFields';
import { getDb } from '@/db/client';
import { blocks, pages } from '@/db/schema';
import { BLOCK_TYPES } from '@/lib/blocks';
import type { RenderableBlock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const db = getDb();
  const page = db.select().from(pages).where(eq(pages.id, id)).get();

  if (!page) {
    notFound();
  }

  const pageBlocks = db
    .select()
    .from(blocks)
    .where(eq(blocks.pageId, page.id))
    .orderBy(asc(blocks.position), asc(blocks.id))
    .all() as RenderableBlock[];

  return (
    <main className="admin-main">
      <h1>{page.title}</h1>

      <section className="panel">
        <h2>Page</h2>
        <form action={updatePage} className="stack">
          <input type="hidden" name="id" value={page.id} />
          <label>
            Title
            <input name="title" defaultValue={page.title} required />
          </label>
          <label>
            Slug
            <input name="slug" defaultValue={page.slug} required pattern="[A-Za-z0-9\-]+" />
          </label>
          <label>
            Menu label
            <input name="navLabel" defaultValue={page.navLabel ?? ''} />
          </label>
          <label>
            Menu order
            <input name="navOrder" type="number" defaultValue={page.navOrder} />
          </label>
          <label>
            Meta description
            <input name="metaDescription" defaultValue={page.metaDescription ?? ''} />
          </label>
          <label className="inline">
            <input name="inMenu" type="checkbox" defaultChecked={page.inMenu} /> Show in menu
          </label>
          <label className="inline">
            <input name="published" type="checkbox" defaultChecked={page.published} /> Published
          </label>
          <button type="submit">Save page</button>
        </form>
      </section>

      <h2>Blocks</h2>
      {pageBlocks.map((block, index) => (
        <section key={block.id} className="panel block-panel">
          <header className="panel-head">
            <strong>{block.type}</strong>
            <span className="panel-actions">
              <form action={moveBlock}>
                <input type="hidden" name="id" value={block.id} />
                <input type="hidden" name="direction" value="up" />
                <button type="submit" className="linkish" disabled={index === 0}>
                  ↑
                </button>
              </form>
              <form action={moveBlock}>
                <input type="hidden" name="id" value={block.id} />
                <input type="hidden" name="direction" value="down" />
                <button type="submit" className="linkish" disabled={index === pageBlocks.length - 1}>
                  ↓
                </button>
              </form>
              <form action={deleteBlock}>
                <input type="hidden" name="id" value={block.id} />
                <button type="submit" className="linkish danger">
                  delete
                </button>
              </form>
            </span>
          </header>
          <form action={updateBlock} className="stack">
            <input type="hidden" name="id" value={block.id} />
            <input type="hidden" name="type" value={block.type} />
            <BlockFields block={block} />
            <button type="submit">Save block</button>
          </form>
        </section>
      ))}

      <section className="panel">
        <h2>Add block</h2>
        <form action={addBlock} className="row-form">
          <input type="hidden" name="pageId" value={page.id} />
          <select name="type" defaultValue="rich_text">
            {BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button type="submit">Add</button>
        </form>
      </section>

      <section className="panel danger-zone">
        <form action={deletePage}>
          <input type="hidden" name="id" value={page.id} />
          <button type="submit" className="danger">
            Delete this page and its blocks
          </button>
        </form>
      </section>
    </main>
  );
}
