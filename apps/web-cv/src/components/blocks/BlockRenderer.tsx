import Image from 'next/image';

import type { RenderableBlock } from '@/lib/queries';

import { ContactFormBlock } from './ContactFormBlock';
import { SkillListBlock } from './SkillListBlock';
import { TimelineBlock } from './TimelineBlock';

export const BlockRenderer = ({ block }: { block: RenderableBlock }) => {
  switch (block.type) {
    case 'heading':
      return block.data.level === 3 ? (
        <h3 className="block heading">{block.data.text}</h3>
      ) : (
        <h2 className="block heading">{block.data.text}</h2>
      );

    case 'rich_text':
      // Authored by the single admin user through the editor, the same trust
      // model as any CMS. Sanitising happens on write, in the admin phase.
      return (
        <div className="block rich-text" dangerouslySetInnerHTML={{ __html: block.data.html }} />
      );

    case 'skill_list':
      return <SkillListBlock data={block.data} />;

    case 'timeline':
      return <TimelineBlock data={block.data} />;

    case 'image':
      return (
        <figure className="block image">
          <Image src={block.data.src} alt={block.data.alt} width={1200} height={800} />
          {block.data.caption ? <figcaption>{block.data.caption}</figcaption> : null}
        </figure>
      );

    case 'contact_form':
      return <ContactFormBlock data={block.data} />;
  }
};
