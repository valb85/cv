'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, FileText, FileUser, MessageSquare, Settings } from 'lucide-react';

import { INTERNAL_ADMIN_PATH } from '@/lib/admin-path';

const ITEMS = [
  { suffix: '', label: 'Pages', Icon: FileText, exact: false },
  { suffix: '/cv', label: 'CV', Icon: FileUser, exact: true },
  { suffix: '/settings', label: 'Settings', Icon: Settings, exact: true },
  { suffix: '/messages', label: 'Messages', Icon: MessageSquare, exact: true },
] as const;

const isActive = (pathname: string, base: string, href: string, exact: boolean): boolean =>
  exact ? pathname === href : pathname === href || pathname.startsWith(`${base}/pages`);

/**
 * usePathname() disagrees between the two renders: in the browser it is the
 * public ADMIN_PATH URL, but during the server render it is the internal
 * /admin path the proxy rewrote to. Comparing that against public hrefs
 * highlighted nothing on the server and the current item in the browser - a
 * hydration mismatch on every admin page. Mapping /admin back onto `base`
 * makes both renders agree.
 */
const toPublicPath = (pathname: string, base: string): string =>
  pathname === INTERNAL_ADMIN_PATH || pathname.startsWith(`${INTERNAL_ADMIN_PATH}/`)
    ? `${base}${pathname.slice(INTERNAL_ADMIN_PATH.length)}`
    : pathname;

/**
 * `base` is the admin's public path, which only the server can resolve - it
 * comes from the environment.
 */
export const AdminNav = ({ base, unread }: { base: string; unread: number }) => {
  const pathname = toPublicPath(usePathname(), base);

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
