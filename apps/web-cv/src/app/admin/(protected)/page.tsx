import { asc } from 'drizzle-orm';
import Link from 'next/link';

import { createPage } from '@/app/admin/actions';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Panel } from '@/components/admin/Panel';
import { Icon } from '@/components/Icon';
import { getDb } from '@/db/client';
import { pages } from '@/db/schema';
import { adminPath } from '@/lib/admin-path';

export const dynamic = 'force-dynamic';

export default function AdminPagesList() {
  const all = getDb().select().from(pages).orderBy(asc(pages.navOrder), asc(pages.id)).all();

  return (
    <>
      <AdminHeader eyebrow="Content" title="Pages" />

      <Panel icon="file" title="All pages">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Menu</th>
              <th>Order</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {all.map((page) => (
              <tr key={page.id}>
                <td>
                  <Link href={adminPath(`/pages/${page.id}`)} className="row-title">
                    <Icon name={page.navIcon ?? undefined} size={17} />
                    {page.title}
                  </Link>
                </td>
                <td>
                  <code>/{page.slug}</code>
                </td>
                <td>{page.inMenu ? (page.navLabel ?? page.title) : '—'}</td>
                <td>{page.navOrder}</td>
                <td>
                  <span className={page.published ? 'tag live' : 'tag'}>
                    {page.published ? 'published' : 'draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel icon="sparkles" title="New page">
        <form action={createPage} className="row-form">
          <input name="title" placeholder="Title" required />
          <input name="slug" placeholder="slug" required pattern="[A-Za-z0-9\-]+" />
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </form>
        <span className="hint">Created as a draft. Publish it from the page editor.</span>
      </Panel>
    </>
  );
}
