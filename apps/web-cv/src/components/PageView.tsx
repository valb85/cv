import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { SiteRail } from '@/components/SiteRail';
import type { NavEntry, PageWithBlocks } from '@/lib/queries';
import type { Tokens } from '@/lib/tokens';

export const PageView = ({
  content,
  nav,
  tokens,
  settings,
  contactSent,
}: {
  content: PageWithBlocks;
  nav: NavEntry[];
  tokens: Tokens;
  settings: Record<string, string>;
  contactSent: boolean;
}) => (
  <div className="layout">
    <SiteRail nav={nav} currentSlug={content.page.slug} settings={settings} />
    <main className="page">
      {content.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} tokens={tokens} contactSent={contactSent} />
      ))}
    </main>
  </div>
);
