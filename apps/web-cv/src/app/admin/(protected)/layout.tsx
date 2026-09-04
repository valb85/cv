import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { logout } from '@/app/admin/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { getCurrentUser } from '@/lib/auth';
import { countUnreadMessages } from '@/lib/queries';
import { getAllSettings } from '@/lib/settings';

import '../admin.css';

export const dynamic = 'force-dynamic';

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  const settings = getAllSettings();
  const name = settings.site_title || user.email;
  const monogram = initials(name);

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          <span className="monogram">{monogram}</span>
          <span className="brand-name">{name}</span>
        </Link>
        <AdminNav unread={countUnreadMessages()} />
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <span className="who">{user.email}</span>
          <form action={logout}>
            <button type="submit" className="linkish">
              Sign out
            </button>
          </form>
          <span className="chip" aria-hidden="true">
            {monogram}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
