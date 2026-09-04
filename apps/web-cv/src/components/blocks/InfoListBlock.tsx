import { Icon } from '@/components/Icon';
import type { BlockDataMap } from '@/lib/blocks';
import { applyTokens, type Tokens } from '@/lib/tokens';

export const InfoListBlock = ({
  data,
  tokens,
}: {
  data: BlockDataMap['info_list'];
  tokens: Tokens;
}) => (
  <section className={data.boxed ? 'block info-list boxed' : 'block info-list'}>
    {data.title ? (
      <div className="section-head">
        <h3>{data.title}</h3>
      </div>
    ) : null}
    <ul>
      {data.items.map((item) => (
        <li key={item.title}>
          <span className="info-icon">
            <Icon name={item.icon} size={20} />
          </span>
          <div>
            <p className="info-title">{item.title}</p>
            <p className="info-text">{applyTokens(item.text, tokens)}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
