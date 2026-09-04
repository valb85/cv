import Link from 'next/link';

import type { NavEntry } from '@/lib/queries';

const href = (slug: string): string => (slug === 'home' ? '/' : `/${slug}`);

export const SiteNav = ({ entries, currentSlug }: { entries: NavEntry[]; currentSlug: string }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <nav className="site-nav" aria-label="Sections">
      <ul>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={href(entry.slug)}
              aria-current={entry.slug === currentSlug ? 'page' : undefined}
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
