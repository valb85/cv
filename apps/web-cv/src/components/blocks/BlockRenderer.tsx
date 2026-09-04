import Image from 'next/image';

import type { RenderableBlock } from '@/lib/queries';
import { applyTokens, type Tokens } from '@/lib/tokens';

import { ContactFormBlock } from './ContactFormBlock';
import { FactListBlock } from './FactListBlock';
import { SkillListBlock } from './SkillListBlock';
import { TimelineBlock } from './TimelineBlock';

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
    case 'heading':
      return block.data.level === 3 ? (
        <h3 className="block heading">{applyTokens(block.data.text, tokens)}</h3>
      ) : (
        <h2 className="block heading">{applyTokens(block.data.text, tokens)}</h2>
      );

    case 'rich_text':
      // Authored by the single admin user through the editor, the same trust
      // model as any CMS. Sanitising happens on write, in the admin phase.
      return (
        <div
          className="block rich-text"
          dangerouslySetInnerHTML={{ __html: applyTokens(block.data.html, tokens) }}
        />
      );

    case 'skill_list':
      return <SkillListBlock data={block.data} />;

    case 'timeline':
      return <TimelineBlock data={block.data} />;

    case 'fact_list':
      return <FactListBlock data={block.data} tokens={tokens} />;

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
