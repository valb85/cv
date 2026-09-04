import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { SiteNav } from '@/components/SiteNav';
import type { NavEntry, PageWithBlocks } from '@/lib/queries';
import type { Tokens } from '@/lib/tokens';

export const PageView = ({
  content,
  nav,
  tokens,
  siteTitle,
  contactSent,
}: {
  content: PageWithBlocks;
  nav: NavEntry[];
  tokens: Tokens;
  siteTitle: string;
  contactSent: boolean;
}) => (
  <>
    <header className="site-header">
      <p className="site-title">{siteTitle}</p>
      <SiteNav entries={nav} />
    </header>
    <main className="page">
      {content.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} tokens={tokens} contactSent={contactSent} />
      ))}
    </main>
  </>
);
