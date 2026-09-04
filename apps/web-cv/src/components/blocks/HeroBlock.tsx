import Image from 'next/image';
import Link from 'next/link';

import { Icon } from '@/components/Icon';
import type { BlockDataMap } from '@/lib/blocks';
import { applyTokens, type Tokens } from '@/lib/tokens';

export const HeroBlock = ({
  data,
  tokens,
}: {
  data: BlockDataMap['hero'];
  tokens: Tokens;
}) => (
  <section className={data.image ? 'block hero has-media' : 'block hero'}>
    {data.image ? (
      <div className="hero-media" aria-hidden="true">
        <Image src={data.image} alt="" width={1344} height={480} priority />
        {data.script ? (
          <p className="hero-script">
            {data.script.split('\n').map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        ) : null}
      </div>
    ) : null}

    <div className="hero-copy">
      {data.eyebrow ? <p className="eyebrow">{data.eyebrow}</p> : null}
      <h1 className="hero-title">
        {data.titleLead}
        {data.titleAccent ? <span className="accent"> {data.titleAccent}</span> : null}
      </h1>
      {data.subtitle ? <p className="hero-subtitle">{data.subtitle}</p> : null}
      {data.body ? <p className="hero-body">{applyTokens(data.body, tokens)}</p> : null}

      {data.primaryLabel || data.secondaryLabel ? (
        <div className="hero-actions">
          {data.primaryLabel ? (
            <Link className="btn btn-primary" href={data.primaryHref ?? '#'}>
              <Icon name={data.primaryIcon} size={18} />
              {data.primaryLabel}
            </Link>
          ) : null}
          {data.secondaryLabel ? (
            <a className="btn btn-ghost" href={data.secondaryHref ?? '#'} download>
              <Icon name={data.secondaryIcon} size={18} />
              {data.secondaryLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  </section>
);
