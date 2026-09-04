import Link from 'next/link';

import { Icon } from '@/components/Icon';
import type { BlockDataMap } from '@/lib/blocks';

export const TimelineBlock = ({ data }: { data: BlockDataMap['timeline'] }) => (
  <section className="block timeline">
    <div className="timeline-head">
      <Icon name={data.icon} size={20} />
      <h3>{data.title}</h3>
    </div>
    <ol className="timeline-list">
      {data.entries.map((entry) => (
        <li key={`${entry.period}-${entry.title}`} className="timeline-entry">
          <span className="period">{entry.period}</span>
          <h4>{entry.title}</h4>
          <p>{entry.description}</p>
          {entry.tags.length > 0 ? <p className="tags">{entry.tags.join(', ')}</p> : null}
          {entry.linkLabel ? (
            <Link className="entry-link" href={entry.linkHref ?? '#'}>
              {entry.linkLabel}
            </Link>
          ) : null}
        </li>
      ))}
    </ol>
  </section>
);
