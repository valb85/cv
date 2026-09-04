import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { logout } from '@/app/admin/actions';
import { getCurrentUser } from '@/lib/auth';

import '../admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <nav>
          <Link href="/admin">Pages</Link>
          <Link href="/admin/settings">Settings</Link>
          <Link href="/admin/messages">Messages</Link>
          <Link href="/">View site</Link>
        </nav>
        <form action={logout}>
          <span className="who">{user.email}</span>
          <button type="submit" className="linkish">
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
