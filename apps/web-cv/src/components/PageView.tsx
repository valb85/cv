import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { SiteNav } from '@/components/SiteNav';
import type { NavEntry, PageWithBlocks } from '@/lib/queries';

export const PageView = ({
  content,
  nav,
}: {
  content: PageWithBlocks;
  nav: NavEntry[];
}) => (
  <>
    <header className="site-header">
      <p className="site-title">{content.page.title}</p>
      <SiteNav entries={nav} />
    </header>
    <main className="page">
      {content.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </main>
  </>
);
