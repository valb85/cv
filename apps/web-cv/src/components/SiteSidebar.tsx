'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/Icon';
import { SocialLinks } from '@/components/SocialLinks';
import { pageHref } from '@/lib/page-href';
import type { NavEntry } from '@/lib/queries';

/** "Victor Albulescu" -> ["Victor", "Albulescu"]: the surname takes the accent. */
const splitName = (name: string): [string, string] => {
  const at = name.trim().lastIndexOf(' ');

  return at > 0 ? [name.slice(0, at), name.slice(at + 1)] : [name, ''];
};

/**
 * Fixed rail on desktop; on narrow screens it collapses to a bar with a
 * drawer. Client component only for that toggle - everything it renders is
 * passed in already resolved from the database.
 */
export const SiteSidebar = ({
  nav,
  currentSlug,
  settings,
}: {
  nav: NavEntry[];
  currentSlug: string;
  settings: Record<string, string>;
}) => {
  const [open, setOpen] = useState(false);
  const [first, last] = splitName(settings.site_title ?? '');

  return (
    <>
      <div className="mobile-bar">
        <Link href="/" className="mobile-brand">
          <BrandMark size={34} />
          <span>{settings.site_title}</span>
        </Link>
        <button
          type="button"
          className="drawer-toggle"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? <button type="button" className="scrim" aria-hidden="true" onClick={() => setOpen(false)} /> : null}

      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Link href="/" className="identity" aria-label={`${settings.site_title ?? 'Home'} - start page`}>
          <BrandMark className="brand-mark" size={52} />
          <span className="identity-text">
            <span className="site-title">
              {first}
              {last ? <span className="accent">{last}</span> : null}
            </span>
            {settings.role ? <span className="role">{settings.role}</span> : null}
          </span>
        </Link>

        <nav className="site-nav" aria-label="Sections">
          <ul>
            {nav.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={pageHref(entry.slug)}
                  aria-current={entry.slug === currentSlug ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon name={entry.icon} size={19} />
                  <span>{entry.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-foot">
          <SocialLinks settings={settings} />
          <p className="colophon">
            © {new Date().getFullYear()} {settings.site_title}
          </p>
        </div>
      </aside>
    </>
  );
};
