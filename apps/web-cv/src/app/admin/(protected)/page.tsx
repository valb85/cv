import Link from 'next/link';
import { asc } from 'drizzle-orm';

import { createPage } from '@/app/admin/actions';
import { getDb } from '@/db/client';
import { pages } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default function AdminPagesList() {
  const all = getDb().select().from(pages).orderBy(asc(pages.navOrder), asc(pages.id)).all();

  return (
    <main className="admin-main">
      <h1>Pages</h1>

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
                <Link href={`/admin/pages/${page.id}`}>{page.title}</Link>
              </td>
              <td>
                <code>/{page.slug}</code>
              </td>
              <td>{page.inMenu ? (page.navLabel ?? page.title) : '—'}</td>
              <td>{page.navOrder}</td>
              <td>{page.published ? 'published' : 'draft'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="panel">
        <h2>New page</h2>
        <form action={createPage} className="row-form">
          <input name="title" placeholder="Title" required />
          <input name="slug" placeholder="slug" required pattern="[A-Za-z0-9\-]+" />
          <button type="submit">Create</button>
        </form>
        <p className="hint">Created as a draft. Publish it from the page editor.</p>
      </section>
    </main>
  );
}
