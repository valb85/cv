import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { BrandMark } from '@/components/BrandMark';
import { getCvDocument } from '@/lib/cv';

import './cv-print.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CV',
  robots: { index: false, follow: false },
};

/** "https://www.linkedin.com/in/someone/" -> "linkedin.com/in/someone" */
const bareUrl = (url: string): string =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');

const hrefFor = (url: string): string => (/^https?:\/\//.test(url) ? url : `https://${url}`);

/**
 * Free text from the editor: blank lines separate paragraphs, and a run of
 * lines starting with "- " (or "• ") becomes a bullet list.
 */
const Prose = ({ text }: { text: string }) => {
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      out.push(<p key={out.length}>{paragraph.join(' ')}</p>);
      paragraph = [];
    }

    if (bullets.length > 0) {
      out.push(
        <ul key={out.length}>
          {bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const bullet = /^[-•*]\s+(.*)$/.exec(line);

    if (bullet) {
      if (paragraph.length > 0) {
        flush();
      }

      bullets.push(bullet[1]);
    } else if (line === '') {
      flush();
    } else {
      if (bullets.length > 0) {
        flush();
      }

      paragraph.push(line);
    }
  }

  flush();

  return out.length > 0 ? <div className="cv-prose">{out}</div> : null;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="cv-section">
    <h2>{title}</h2>
    {children}
  </section>
);

/**
 * The source of /cv.pdf: the CV edited under Admin -> CV (or, until it is
 * first saved, a draft imported from the site). Headless Chromium prints this
 * page; open it in a browser and use print preview to work on the layout.
 */
export default function CvPrintPage() {
  const cv = getCvDocument();

  const contacts = [
    cv.location ? { key: 'location', text: cv.location } : null,
    cv.phone ? { key: 'phone', text: cv.phone, href: `tel:${cv.phone.replace(/[^\d+]/g, '')}` } : null,
    cv.email ? { key: 'email', text: cv.email, href: `mailto:${cv.email}` } : null,
    cv.website ? { key: 'website', text: bareUrl(cv.website), href: hrefFor(cv.website) } : null,
    cv.linkedin ? { key: 'linkedin', text: bareUrl(cv.linkedin), href: hrefFor(cv.linkedin) } : null,
    cv.github ? { key: 'github', text: bareUrl(cv.github), href: hrefFor(cv.github) } : null,
  ].filter((entry) => entry !== null);

  return (
    <main className="cv">
      <header className="cv-header">
        <BrandMark size={58} />
        <div>
          <h1 className="cv-name">{cv.name}</h1>
          {cv.headline ? <p className="cv-headline">{cv.headline}</p> : null}
          {contacts.length > 0 ? (
            <ul className="cv-contacts">
              {contacts.map((contact) => (
                <li key={contact.key}>
                  {contact.href ? <a href={contact.href}>{contact.text}</a> : contact.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {cv.summary ? (
        <Section title="Profile">
          <Prose text={cv.summary} />
        </Section>
      ) : null}

      {cv.experience.length > 0 ? (
        <Section title="Experience">
          {cv.experience.map((job, i) => (
            <article key={i} className="cv-entry">
              <p className="cv-when">{job.period}</p>
              <div>
                <h3>{job.role}</h3>
                {job.company || job.location ? (
                  <p className="cv-where">{[job.company, job.location].filter(Boolean).join(' · ')}</p>
                ) : null}
                <Prose text={job.description} />
                {job.tech.length > 0 ? <p className="cv-tech">{job.tech.join(' · ')}</p> : null}
              </div>
            </article>
          ))}
        </Section>
      ) : null}

      {cv.skills.length > 0 ? (
        <Section title="Skills">
          <dl className="cv-skills">
            {cv.skills.map((group, i) => (
              <div key={i}>
                <dt>{group.group}</dt>
                <dd>{group.items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {cv.projects.length > 0 ? (
        <Section title="Projects">
          {cv.projects.map((project, i) => (
            <article key={i} className="cv-project">
              <h3>
                {project.name}
                {project.link ? (
                  <a className="cv-link" href={hrefFor(project.link)}>
                    {bareUrl(project.link)}
                  </a>
                ) : null}
              </h3>
              <Prose text={project.description} />
              {project.tech.length > 0 ? <p className="cv-tech">{project.tech.join(' · ')}</p> : null}
            </article>
          ))}
        </Section>
      ) : null}

      {cv.education.length > 0 ? (
        <Section title="Education">
          {cv.education.map((school, i) => (
            <article key={i} className="cv-entry">
              <p className="cv-when">{school.period}</p>
              <div>
                <h3>{school.degree}</h3>
                {school.school ? <p className="cv-where">{school.school}</p> : null}
                <Prose text={school.description} />
              </div>
            </article>
          ))}
        </Section>
      ) : null}

      {cv.languages.length > 0 || cv.interests.length > 0 ? (
        <div className="cv-pair">
          {cv.languages.length > 0 ? (
            <Section title="Languages">
              <ul className="cv-plain">
                {cv.languages.map((language, i) => (
                  <li key={i}>
                    <strong>{language.name}</strong>
                    {language.level ? ` - ${language.level}` : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {cv.interests.length > 0 ? (
            <Section title="Interests">
              <p>{cv.interests.join(', ')}</p>
            </Section>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
