'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Icon } from '@/components/Icon';
import { SocialLinks } from '@/components/SocialLinks';
import type { NavEntry } from '@/lib/queries';

const href = (slug: string): string => (slug === 'home' ? '/' : `/${slug}`);

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

  return (
    <>
      <div className="mobile-bar">
        <Link href="/" className="mobile-brand">
          {settings.avatar ? (
            <Image className="avatar avatar-sm" src={settings.avatar} alt="" width={72} height={72} />
          ) : null}
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
        <div className="identity">
          {settings.avatar ? (
            <Image
              className="avatar"
              src={settings.avatar}
              alt={settings.site_title ?? ''}
              width={220}
              height={220}
              priority
            />
          ) : null}
          <p className="site-title">{settings.site_title}</p>
          {settings.role ? <p className="role">{settings.role}</p> : null}
        </div>

        <nav className="site-nav" aria-label="Sections">
          <ul>
            {nav.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={href(entry.slug)}
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
            {settings.footer_note ? (
              <>
                <br />
                {settings.footer_note}
              </>
            ) : null}
          </p>
        </div>
      </aside>
    </>
  );
};
