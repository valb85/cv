import Image from 'next/image';
import Link from 'next/link';

import type { BlockDataMap } from '@/lib/blocks';

export const ProjectGridBlock = ({ data }: { data: BlockDataMap['project_grid'] }) => (
  <section className="block project-grid">
    <div className={`grid cols-${data.columns}`}>
      {data.projects.map((project) => (
        <article key={project.title} className="card project">
          {project.image ? (
            <Image
              className="project-shot"
              src={project.image}
              alt=""
              width={568}
              height={420}
            />
          ) : null}
          <h4>{project.title}</h4>
          <p>{project.text}</p>
          {project.tags.length > 0 ? (
            <ul className="pills small">
              {project.tags.map((tag) => (
                <li key={tag} className="pill">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          {project.linkLabel ? (
            <Link className="project-link" href={project.linkHref ?? '#'}>
              {project.linkLabel} <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  </section>
);
