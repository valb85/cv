import type { BlockDataMap } from '@/lib/blocks';

export const QuoteBlock = ({ data }: { data: BlockDataMap['quote'] }) => (
  <figure className="block quote">
    <blockquote>{data.text}</blockquote>
    {data.attribution ? <figcaption>— {data.attribution}</figcaption> : null}
  </figure>
);
