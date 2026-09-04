import Image from 'next/image';

import { CardGridBlock } from '@/components/blocks/CardGridBlock';
import { ContactFormBlock } from '@/components/blocks/ContactFormBlock';
import { FactListBlock } from '@/components/blocks/FactListBlock';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { InfoListBlock } from '@/components/blocks/InfoListBlock';
import { PillGroupBlock } from '@/components/blocks/PillGroupBlock';
import { ProjectGridBlock } from '@/components/blocks/ProjectGridBlock';
import { QuoteBlock } from '@/components/blocks/QuoteBlock';
import { SkillListBlock } from '@/components/blocks/SkillListBlock';
import { TimelineBlock } from '@/components/blocks/TimelineBlock';
import type { RenderableBlock } from '@/lib/queries';
import { applyTokens, type Tokens } from '@/lib/tokens';

export const BlockRenderer = ({
  block,
  tokens,
  contactSent = false,
}: {
  block: RenderableBlock;
  tokens: Tokens;
  contactSent?: boolean;
}) => {
  switch (block.type) {
    case 'hero':
      return <HeroBlock data={block.data} tokens={tokens} />;

    case 'heading':
      return block.data.level === 3 ? (
        <h3 className="block heading">{applyTokens(block.data.text, tokens)}</h3>
      ) : (
        <h2 className="block heading">{applyTokens(block.data.text, tokens)}</h2>
      );

    case 'rich_text':
      // Authored by the single admin user through the editor, and sanitised on
      // write, so the stored HTML is already an allow-listed subset.
      return (
        <div
          className="block rich-text"
          dangerouslySetInnerHTML={{ __html: applyTokens(block.data.html, tokens) }}
        />
      );

    case 'card_grid':
      return <CardGridBlock data={block.data} tokens={tokens} />;

    case 'pill_group':
      return <PillGroupBlock data={block.data} />;

    case 'info_list':
      return <InfoListBlock data={block.data} tokens={tokens} />;

    case 'project_grid':
      return <ProjectGridBlock data={block.data} />;

    case 'timeline':
      return <TimelineBlock data={block.data} />;

    case 'skill_list':
      return <SkillListBlock data={block.data} />;

    case 'fact_list':
      return <FactListBlock data={block.data} tokens={tokens} />;

    case 'quote':
      return <QuoteBlock data={block.data} />;

    case 'image':
      return (
        <figure className="block image">
          <Image src={block.data.src} alt={block.data.alt} width={1200} height={800} />
          {block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}
        </figure>
      );

    case 'contact_form':
      return (
        <ContactFormBlock data={block.data} initialStatus={contactSent ? 'sent' : 'idle'} />
      );
  }
};
