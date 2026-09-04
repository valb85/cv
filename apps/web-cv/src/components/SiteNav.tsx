import Link from 'next/link';

import type { NavEntry } from '@/lib/queries';

export const SiteNav = ({ entries }: { entries: NavEntry[] }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <nav className="site-nav">
      <ul>
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link href={entry.slug === 'home' ? '/' : `/${entry.slug}`}>{entry.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
