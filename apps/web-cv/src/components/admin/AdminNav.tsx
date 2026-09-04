'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, FileText, MessageSquare, Settings } from 'lucide-react';

const ITEMS = [
  { suffix: '', label: 'Pages', Icon: FileText, exact: false },
  { suffix: '/settings', label: 'Settings', Icon: Settings, exact: true },
  { suffix: '/messages', label: 'Messages', Icon: MessageSquare, exact: true },
] as const;

const isActive = (pathname: string, base: string, href: string, exact: boolean): boolean =>
  exact ? pathname === href : pathname === href || pathname.startsWith(`${base}/pages`);

/**
 * `base` is the admin's public path, which only the server can resolve - it
 * comes from the environment. usePathname() reports that same public path,
 * because the rewrite to /admin happens behind the browser's back.
 */
export const AdminNav = ({ base, unread }: { base: string; unread: number }) => {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      <p className="nav-label">Admin</p>
      <ul>
        {ITEMS.map(({ suffix, label, Icon, exact }) => {
          const href = `${base}${suffix}`;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(pathname, base, href, exact) ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
                <span>{label}</span>
                {label === 'Messages' && unread > 0 ? (
                  <span className="badge" aria-label={`${unread} unread`}>
                    {unread}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
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
