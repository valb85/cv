import { Icon } from '@/components/Icon';
import type { BlockDataMap } from '@/lib/blocks';
import { applyTokens, type Tokens } from '@/lib/tokens';

export const CardGridBlock = ({
  data,
  tokens,
}: {
  data: BlockDataMap['card_grid'];
  tokens: Tokens;
}) => (
  <section className="block card-grid">
    {data.title ? (
      <div className="section-head">
        <h3>{data.title}</h3>
      </div>
    ) : null}
    <div className={`grid cols-${data.columns}`}>
      {data.cards.map((card) => (
        <article key={card.title} className="card">
          <div className="card-icon">
            <Icon name={card.icon} size={26} />
          </div>
          {card.stat ? <p className="card-stat">{applyTokens(card.stat, tokens)}</p> : null}
          <h4>{card.title}</h4>
          <p>{applyTokens(card.text, tokens)}</p>
        </article>
      ))}
    </div>
  </section>
);
