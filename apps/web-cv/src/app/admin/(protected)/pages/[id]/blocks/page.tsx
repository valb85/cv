import { asc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { addBlock, deleteBlock, moveBlock, updateBlock } from '@/app/admin/actions';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { BlockFields } from '@/components/admin/BlockFields';
import { Panel } from '@/components/admin/Panel';
import { getDb } from '@/db/client';
import { blocks, pages } from '@/db/schema';
import { BLOCK_TYPES } from '@/lib/blocks';
import type { RenderableBlock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function BlockEditor({ params }: { params: Promise<{ id: string }> }) {
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
    <>
      <AdminHeader eyebrow={`Blocks — ${page.title}`} title="Manage blocks" />

      <p className="back-link">
        <Link href={`/admin/pages/${page.id}`}>← Back to page settings</Link>
      </p>

      {pageBlocks.map((block, index) => (
        <section key={block.id} className="panel block-panel">
          <div className="panel-head">
            <span className="panel-icon">
              <span className="block-type">{block.type}</span>
            </span>
            <span className="panel-action">
              <form action={moveBlock}>
                <input type="hidden" name="id" value={block.id} />
                <input type="hidden" name="direction" value="up" />
                <button type="submit" className="linkish" disabled={index === 0} aria-label="Move up">
                  ↑
                </button>
              </form>
              <form action={moveBlock}>
                <input type="hidden" name="id" value={block.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  className="linkish"
                  disabled={index === pageBlocks.length - 1}
                  aria-label="Move down"
                >
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
          </div>

          <AdminForm action={updateBlock} className="stack" submitLabel="Save block">
            <input type="hidden" name="id" value={block.id} />
            <input type="hidden" name="type" value={block.type} />
            {page.columns > 1 ? (
              <label>
                Column
                <select name="column" defaultValue={String(block.column)}>
                  <option value="0">full width</option>
                  {Array.from({ length: page.columns }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      column {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <BlockFields block={block} />
          </AdminForm>
        </section>
      ))}

      <Panel icon="layers" title="Add block">
        <form action={addBlock} className="row-form">
          <input type="hidden" name="pageId" value={page.id} />
          <select name="type" defaultValue="rich_text">
            {BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </Panel>
    </>
  );
}
