import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { deletePage, updatePage } from '@/app/admin/actions';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CountedTextarea } from '@/components/admin/CountedTextarea';
import { Panel } from '@/components/admin/Panel';
import { Toggle } from '@/components/admin/Toggle';
import { getDb } from '@/db/client';
import { pages } from '@/db/schema';
import { ICON_NAMES } from '@/lib/icons';

export const dynamic = 'force-dynamic';

export default async function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const page = getDb().select().from(pages).where(eq(pages.id, id)).get();

  if (!page) {
    notFound();
  }

  return (
    <>
      <AdminHeader eyebrow="Edit Page" title={page.title} />

      <AdminForm
        action={updatePage}
        className="editor-grid"
        submitLabel="Save page"
        extra={
          <Link
            className="btn btn-ghost"
            href={page.slug === 'home' ? '/' : `/${page.slug}`}
            target="_blank"
          >
            Preview
          </Link>
        }
      >
        <input type="hidden" name="id" value={page.id} />

        <Panel icon="file" title="Basic Info">
          <label>
            Title
            <input name="title" defaultValue={page.title} required />
          </label>
          <div className="pair">
            <label>
              Slug
              <input name="slug" defaultValue={page.slug} required pattern="[A-Za-z0-9\-]+" />
            </label>
            <label>
              Menu label
              <input name="navLabel" defaultValue={page.navLabel ?? ''} />
            </label>
          </div>
          <div className="pair">
            <label>
              Menu icon
              <select name="navIcon" defaultValue={page.navIcon ?? ''}>
                <option value="">(none)</option>
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Menu order
              <input name="navOrder" type="number" defaultValue={page.navOrder} />
            </label>
          </div>
        </Panel>

        <Panel icon="grid" title="Layout">
          <label>
            Layout columns
            <select name="columns" defaultValue={String(page.columns)}>
              <option value="1">1 — single column</option>
              <option value="2">2 — main + side</option>
              <option value="3">3 — three columns</option>
            </select>
            <span className="hint">Choose the column layout for this page.</span>
          </label>
        </Panel>

        <Panel icon="globe" title="SEO">
          <label>
            Meta description
            <CountedTextarea name="metaDescription" defaultValue={page.metaDescription ?? ''} limit={160} />
          </label>
        </Panel>

        <Panel icon="user" title="Visibility">
          <Toggle
            name="inMenu"
            label="Show in menu"
            hint="Display this page in the navigation menu."
            defaultChecked={page.inMenu}
          />
          <Toggle
            name="published"
            label="Published"
            hint="Make this page visible to your visitors."
            defaultChecked={page.published}
          />
        </Panel>

      </AdminForm>

      <Panel
        icon="layers"
        title="Blocks"
        action={
          <Link className="btn btn-ghost" href={`/admin/pages/${page.id}/blocks`}>
            Manage blocks →
          </Link>
        }
      >
        <p className="hint">
          Manage the content blocks for this page. Add, reorder and configure your blocks.
        </p>
      </Panel>

      <section className="panel danger-zone">
        <form action={deletePage}>
          <input type="hidden" name="id" value={page.id} />
          <button type="submit" className="danger">
            Delete this page and its blocks
          </button>
        </form>
      </section>
    </>
  );
}
