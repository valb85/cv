'use client';

import type { CvDocument } from '@/lib/cv-document';

import { Panel } from './Panel';
import { RepeatingRows } from './RepeatingRows';

/**
 * The CV editor's fields. Client-side because RepeatingRows renders rows from
 * a function, which cannot cross from a server component. Every list posts as
 * parallel arrays and is parsed by parseCvForm (src/lib/cv-document.ts).
 */
export const CvFields = ({ cv }: { cv: CvDocument }) => (
  <>
    <Panel icon="user" title="Personal details">
      <div className="pair cv-pair">
        <label>
          Full name
          <input name="name" defaultValue={cv.name} required />
        </label>
        <label>
          Headline
          <input name="headline" defaultValue={cv.headline} placeholder="Senior Full-Stack Developer" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" defaultValue={cv.email} />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" defaultValue={cv.phone} placeholder="+40 ..." />
        </label>
        <label>
          Location
          <input name="location" defaultValue={cv.location} placeholder="Timisoara, Romania" />
        </label>
        <label>
          Website
          <input name="website" defaultValue={cv.website} placeholder="https://..." />
        </label>
        <label>
          LinkedIn URL
          <input name="linkedin" defaultValue={cv.linkedin} />
        </label>
        <label>
          GitHub URL
          <input name="github" defaultValue={cv.github} />
        </label>
      </div>
      <span className="hint">Blank fields are left off the PDF.</span>
    </Panel>

    <Panel icon="file" title="Summary">
      <label>
        Profile
        <textarea name="summary" rows={9} defaultValue={cv.summary} />
        <span className="hint">A blank line starts a new paragraph.</span>
      </label>
      <label>
        Interests
        <input name="interests" defaultValue={cv.interests.join(', ')} placeholder="Travel, Photography" />
        <span className="hint">Comma-separated. Blank hides the section.</span>
      </label>
    </Panel>

    <Panel icon="briefcase" title="Experience" wide>
      <RepeatingRows
        reorderable
        className="cv-rows"
        initialCount={cv.experience.length + 1}
        addLabel="+ add position"
        renderRow={(i) => (
          <>
            <input name="expRole" placeholder="Role" defaultValue={cv.experience[i]?.role ?? ''} />
            <input name="expCompany" placeholder="Company" defaultValue={cv.experience[i]?.company ?? ''} />
            <input name="expLocation" placeholder="Location / Remote" defaultValue={cv.experience[i]?.location ?? ''} />
            <input name="expPeriod" placeholder="2014 - Present" defaultValue={cv.experience[i]?.period ?? ''} />
            <textarea
              name="expDescription"
              rows={4}
              placeholder={'What you did. Start lines with "- " for bullet points.'}
              defaultValue={cv.experience[i]?.description ?? ''}
            />
            <input name="expTech" placeholder="PHP, Laravel, React" defaultValue={cv.experience[i]?.tech.join(', ') ?? ''} />
          </>
        )}
      />
      <span className="hint">
        Printed in this order; use the arrows to move a position. Clear the role to remove it.
      </span>
    </Panel>

    <Panel icon="graduation" title="Education" wide>
      <RepeatingRows
        reorderable
        className="cv-rows"
        initialCount={cv.education.length + 1}
        addLabel="+ add education"
        renderRow={(i) => (
          <>
            <input name="eduDegree" placeholder="Degree" defaultValue={cv.education[i]?.degree ?? ''} />
            <input name="eduSchool" placeholder="School" defaultValue={cv.education[i]?.school ?? ''} />
            <input name="eduPeriod" placeholder="2012 - 2014" defaultValue={cv.education[i]?.period ?? ''} />
            <textarea name="eduDescription" rows={2} placeholder="Details (optional)" defaultValue={cv.education[i]?.description ?? ''} />
          </>
        )}
      />
      <span className="hint">Clear the degree to remove an entry.</span>
    </Panel>

    <Panel icon="code" title="Skills">
      <RepeatingRows
        reorderable
        initialCount={cv.skills.length + 1}
        addLabel="+ add skill group"
        renderRow={(i) => (
          <>
            <input name="skillGroup" placeholder="Backend" defaultValue={cv.skills[i]?.group ?? ''} />
            <input name="skillItems" placeholder="PHP, Laravel, MySQL" defaultValue={cv.skills[i]?.items.join(', ') ?? ''} />
          </>
        )}
      />
      <span className="hint">One group per row, skills comma-separated. Clear the group to remove it.</span>
    </Panel>

    <Panel icon="languages" title="Languages">
      <RepeatingRows
        reorderable
        initialCount={cv.languages.length + 1}
        addLabel="+ add language"
        renderRow={(i) => (
          <>
            <input name="langName" placeholder="English" defaultValue={cv.languages[i]?.name ?? ''} />
            <input name="langLevel" placeholder="Advanced (C1)" defaultValue={cv.languages[i]?.level ?? ''} />
          </>
        )}
      />
      <span className="hint">Clear the name to remove a language.</span>
    </Panel>

    <Panel icon="rocket" title="Projects" wide>
      <RepeatingRows
        reorderable
        className="cv-rows"
        initialCount={cv.projects.length + 1}
        addLabel="+ add project"
        renderRow={(i) => (
          <>
            <input name="projName" placeholder="Project name" defaultValue={cv.projects[i]?.name ?? ''} />
            <input name="projLink" placeholder="https://... (optional)" defaultValue={cv.projects[i]?.link ?? ''} />
            <textarea name="projDescription" rows={2} placeholder="What it is and your part in it" defaultValue={cv.projects[i]?.description ?? ''} />
            <input name="projTech" placeholder="Next.js, Prisma" defaultValue={cv.projects[i]?.tech.join(', ') ?? ''} />
          </>
        )}
      />
      <span className="hint">Clear the name to remove a project. No projects hides the section.</span>
    </Panel>
  </>
);
