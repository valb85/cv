import Link from 'next/link';

import { Icon } from '@/components/Icon';
import type { BlockDataMap } from '@/lib/blocks';

export const PillGroupBlock = ({ data }: { data: BlockDataMap['pill_group'] }) => (
  <section className="block pill-group">
    {data.title || data.linkLabel ? (
      <div className="pill-head">
        {data.title ? (
          <div className="section-head">
            <h3>{data.title}</h3>
          </div>
        ) : (
          <span />
        )}
        {data.linkLabel ? (
          <Link className="more-link" href={data.linkHref ?? '#'}>
            {data.linkLabel} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    ) : null}
    <ul className="pills">
      {data.pills.map((pill) => (
        <li key={pill.label} className="pill">
          <Icon name={pill.icon} size={15} />
          {pill.label}
        </li>
      ))}
    </ul>
  </section>
);
