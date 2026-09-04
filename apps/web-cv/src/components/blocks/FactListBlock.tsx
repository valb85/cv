import type { BlockDataMap } from '@/lib/blocks';
import { applyTokens, type Tokens } from '@/lib/tokens';

export const FactListBlock = ({
  data,
  tokens,
}: {
  data: BlockDataMap['fact_list'];
  tokens: Tokens;
}) => (
  <section className="block facts">
    {data.title ? <h3>{data.title}</h3> : null}
    <dl className="fact-list">
      {data.facts.map((fact) => (
        <div key={fact.label} className="fact">
          <dt>{fact.label}</dt>
          <dd>{applyTokens(fact.value, tokens)}</dd>
        </div>
      ))}
    </dl>
  </section>
);
