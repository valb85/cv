import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { SiteSidebar } from '@/components/SiteSidebar';
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
}) => {
  const { columns } = content.page;

  return (
    <div className="layout">
      <SiteSidebar nav={nav} currentSlug={content.page.slug} settings={settings} />
      <main className={columns > 1 ? `page page-grid cols-${columns}` : 'page'}>
        {content.blocks.map((block) => (
          <div
            key={block.id}
            // column 0 spans the grid; anything else lands in that column
            className={columns > 1 ? `slot col-${block.column}` : 'slot'}
          >
            <BlockRenderer block={block} tokens={tokens} contactSent={contactSent} />
          </div>
        ))}
      </main>
    </div>
  );
};
