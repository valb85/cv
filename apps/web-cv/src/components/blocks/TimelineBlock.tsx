import type { BlockDataMap } from '@/lib/blocks';

export const TimelineBlock = ({ data }: { data: BlockDataMap['timeline'] }) => (
  <section className="block timeline">
    <h3>{data.title}</h3>
    <ol className="timeline-list">
      {data.entries.map((entry) => (
        <li key={`${entry.period}-${entry.title}`} className="timeline-entry">
          <span className="period">{entry.period}</span>
          <div>
            <h4>{entry.title}</h4>
            <p>{entry.description}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);
