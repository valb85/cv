import Image from 'next/image';
import Link from 'next/link';

import { SiteNav } from '@/components/SiteNav';
import { SocialLinks } from '@/components/SocialLinks';
import type { NavEntry } from '@/lib/queries';

export const SiteRail = ({
  nav,
  currentSlug,
  settings,
}: {
  nav: NavEntry[];
  currentSlug: string;
  settings: Record<string, string>;
}) => (
  <aside className="rail">
    <div className="identity">
      {settings.avatar === '' ? null : (
        <Image
          className="avatar"
          src={settings.avatar || '/images/me.jpg'}
          alt=""
          width={144}
          height={144}
          priority
        />
      )}
      <p className="site-title">
        <Link href="/" style={{ textDecoration: 'none' }}>
          {settings.site_title || 'CV'}
        </Link>
      </p>
      {settings.tagline ? <p className="tagline">{settings.tagline}</p> : null}
    </div>

    <SiteNav entries={nav} currentSlug={currentSlug} />
    <SocialLinks settings={settings} />
  </aside>
);
