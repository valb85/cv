'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, FileText, MessageSquare, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/admin', label: 'Pages', Icon: FileText, exact: false },
  { href: '/admin/settings', label: 'Settings', Icon: Settings, exact: true },
  { href: '/admin/messages', label: 'Messages', Icon: MessageSquare, exact: true },
] as const;

const isActive = (pathname: string, href: string, exact: boolean): boolean =>
  exact ? pathname === href : pathname === href || pathname.startsWith('/admin/pages');

export const AdminNav = ({ unread }: { unread: number }) => {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      <p className="nav-label">Admin</p>
      <ul>
        {ITEMS.map(({ href, label, Icon, exact }) => (
          <li key={href}>
            <Link href={href} aria-current={isActive(pathname, href, exact) ? 'page' : undefined}>
              <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
              <span>{label}</span>
              {label === 'Messages' && unread > 0 ? (
                <span className="badge" aria-label={`${unread} unread`}>
                  {unread}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <hr />
      <ul>
        <li>
          <Link href="/" target="_blank">
            <ExternalLink size={19} strokeWidth={1.75} aria-hidden="true" />
            <span>View site</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};
