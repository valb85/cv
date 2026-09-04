import type { BlockDataMap } from '@/lib/blocks';

export const SkillListBlock = ({ data }: { data: BlockDataMap['skill_list'] }) => (
  <section className="block skills">
    {data.title ? (
      <div className="section-head">
        <h3>{data.title}</h3>
      </div>
    ) : null}
    <ul className="skill-list">
      {data.skills.map((skill) => (
        <li key={skill.name} className="skill">
          <span className="skill-name">{skill.name}</span>
          <span className="skill-label">{skill.label}</span>
          <span className="skill-dots" role="img" aria-label={`${skill.level} out of 5`}>
            {[1, 2, 3, 4, 5].map((step) => (
              <span key={step} className={step <= skill.level ? 'dot on' : 'dot'} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  </section>
);
