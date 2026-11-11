import type { ReactNode } from 'react';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { SiteSidebar } from '@/components/SiteSidebar';
import type { NavEntry, PageWithBlocks, RenderableBlock } from '@/lib/queries';
import type { Tokens } from '@/lib/tokens';

type Slot = { key: string; column: number; blocks: RenderableBlock[] };

/**
 * Groups a multi-column page into grid cells. Column 0 blocks span the grid
 * on their own; every run of blocks between them becomes one row with a
 * single stacked cell per column. One cell per block would start each block
 * on a new row, so a column's second block pushed the next column down.
 */
const toSlots = (blocks: RenderableBlock[], columns: number): Slot[] => {
  if (columns <= 1) {
    return blocks.map((block) => ({ key: `${block.id}`, column: 0, blocks: [block] }));
  }

  const slots: Slot[] = [];
  let run: RenderableBlock[] = [];

  const flush = () => {
    for (let column = 1; column <= columns; column++) {
      const inColumn = run.filter((block) => block.column === column);

      if (inColumn.length > 0) {
        slots.push({ key: `${inColumn[0].id}`, column, blocks: inColumn });
      }
    }

    run = [];
  };

  for (const block of blocks) {
    if (block.column > 0 && block.column <= columns) {
      run.push(block);
      continue;
    }

    flush();
    slots.push({ key: `${block.id}`, column: 0, blocks: [block] });
  }

  flush();

  return slots;
};

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

  const render = (block: RenderableBlock): ReactNode => (
    <BlockRenderer key={block.id} block={block} tokens={tokens} contactSent={contactSent} />
  );

  return (
    <div className="layout">
      <SiteSidebar nav={nav} currentSlug={content.page.slug} settings={settings} />
      <main className={columns > 1 ? `page page-grid cols-${columns}` : 'page'}>
        {toSlots(content.blocks, columns).map((slot) => (
          <div
            key={slot.key}
            // column 0 spans the grid; anything else lands in that column
            className={columns > 1 ? `slot col-${slot.column}` : 'slot'}
          >
            {slot.blocks.map(render)}
          </div>
        ))}
      </main>
    </div>
  );
};
