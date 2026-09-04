'use client';

import { ICON_NAMES } from '@/lib/icons';
import type { RenderableBlock } from '@/lib/queries';

import { RepeatingRows } from './RepeatingRows';

const IconSelect = ({ name, value }: { name: string; value: string | undefined }) => (
  <select name={name} defaultValue={value ?? ''}>
    <option value="">(no icon)</option>
    {ICON_NAMES.map((icon) => (
      <option key={icon} value={icon}>
        {icon}
      </option>
    ))}
  </select>
);

const ColumnSelect = ({ value, max }: { value: number; max: 4 | 5 }) => (
  <label>
    Columns
    <select name="columns" defaultValue={String(value)}>
      {[2, 3, 4, 5].filter((n) => n <= max).map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  </label>
);

export const BlockFields = ({ block }: { block: RenderableBlock }) => {
  switch (block.type) {
    case 'hero':
      return (
        <>
          <label>
            Eyebrow
            <input name="eyebrow" defaultValue={block.data.eyebrow ?? ''} placeholder="HELLO, I'M" />
          </label>
          <label>
            Title — white part
            <input name="titleLead" defaultValue={block.data.titleLead} />
          </label>
          <label>
            Title — accent part
            <input name="titleAccent" defaultValue={block.data.titleAccent ?? ''} />
          </label>
          <label>
            Subtitle
            <input name="subtitle" defaultValue={block.data.subtitle ?? ''} />
          </label>
          <label>
            Body
            <textarea name="body" rows={4} defaultValue={block.data.body ?? ''} />
            <span className="hint">{'{{age}}'} works here.</span>
          </label>
          <div className="rows">
            <div className="row">
              <input name="primaryLabel" placeholder="Button label" defaultValue={block.data.primaryLabel ?? ''} />
              <input name="primaryHref" placeholder="/contact" defaultValue={block.data.primaryHref ?? ''} />
              <IconSelect name="primaryIcon" value={block.data.primaryIcon} />
            </div>
            <div className="row">
              <input name="secondaryLabel" placeholder="Second button" defaultValue={block.data.secondaryLabel ?? ''} />
              <input name="secondaryHref" placeholder="/cv.pdf" defaultValue={block.data.secondaryHref ?? ''} />
              <IconSelect name="secondaryIcon" value={block.data.secondaryIcon} />
            </div>
          </div>
          <label>
            Background image
            <input name="image" defaultValue={block.data.image ?? ''} placeholder="/images/hero-desk.jpg" />
          </label>
          <label>
            Script overlay
            <textarea name="script" rows={4} defaultValue={block.data.script ?? ''} />
            <span className="hint">One word per line, drawn over the image.</span>
          </label>
        </>
      );

    case 'heading':
      return (
        <>
          <label>
            Text
            <input name="text" defaultValue={block.data.text} />
          </label>
          <label>
            Level
            <select name="level" defaultValue={String(block.data.level)}>
              <option value="2">H2</option>
              <option value="3">H3</option>
            </select>
          </label>
        </>
      );

    case 'rich_text':
      return (
        <label>
          HTML
          <textarea name="html" rows={8} defaultValue={block.data.html} />
          <span className="hint">
            Allowed: p, br, strong, em, ul/ol/li, h2-h4, a, blockquote, code. Anything else is
            stripped on save. Use {'{{age}}'} for the computed age.
          </span>
        </label>
      );

    case 'card_grid':
      return (
        <>
          <label>
            Title (optional)
            <input name="title" defaultValue={block.data.title ?? ''} />
          </label>
          <ColumnSelect value={block.data.columns} max={5} />
          <RepeatingRows
            initialCount={block.data.cards.length + 1}
            addLabel="+ add card"
            renderRow={(i) => (
              <>
                <IconSelect name="cardIcon" value={block.data.cards[i]?.icon} />
                <input name="cardStat" placeholder="14+ (optional)" defaultValue={block.data.cards[i]?.stat ?? ''} />
                <input name="cardTitle" placeholder="Title" defaultValue={block.data.cards[i]?.title ?? ''} />
                <textarea name="cardText" rows={2} placeholder="Text" defaultValue={block.data.cards[i]?.text ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the title to remove a card.</span>
        </>
      );

    case 'pill_group':
      return (
        <>
          <label>
            Title (optional)
            <input name="title" defaultValue={block.data.title ?? ''} />
          </label>
          <div className="rows">
            <div className="row">
              <input name="linkLabel" placeholder="View all skills" defaultValue={block.data.linkLabel ?? ''} />
              <input name="linkHref" placeholder="/resume" defaultValue={block.data.linkHref ?? ''} />
            </div>
          </div>
          <RepeatingRows
            initialCount={block.data.pills.length + 1}
            addLabel="+ add pill"
            renderRow={(i) => (
              <>
                <input name="pillLabel" placeholder="Label" defaultValue={block.data.pills[i]?.label ?? ''} />
                <IconSelect name="pillIcon" value={block.data.pills[i]?.icon} />
              </>
            )}
          />
          <span className="hint">Clear the label to remove a pill.</span>
        </>
      );

    case 'info_list':
      return (
        <>
          <label>
            Title (optional)
            <input name="title" defaultValue={block.data.title ?? ''} />
          </label>
          <label className="inline">
            <input name="boxed" type="checkbox" defaultChecked={block.data.boxed} /> Show each item
            as a card
          </label>
          <RepeatingRows
            initialCount={block.data.items.length + 1}
            addLabel="+ add item"
            renderRow={(i) => (
              <>
                <IconSelect name="itemIcon" value={block.data.items[i]?.icon} />
                <input name="itemTitle" placeholder="Title" defaultValue={block.data.items[i]?.title ?? ''} />
                <input name="itemText" placeholder="Text" defaultValue={block.data.items[i]?.text ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the title to remove an item.</span>
        </>
      );

    case 'project_grid':
      return (
        <>
          <ColumnSelect value={block.data.columns} max={4} />
          <RepeatingRows
            initialCount={block.data.projects.length + 1}
            addLabel="+ add project"
            renderRow={(i) => (
              <>
                <input name="projectTitle" placeholder="Title" defaultValue={block.data.projects[i]?.title ?? ''} />
                <input name="projectImage" placeholder="/images/project-x.jpg" defaultValue={block.data.projects[i]?.image ?? ''} />
                <textarea name="projectText" rows={2} placeholder="Description" defaultValue={block.data.projects[i]?.text ?? ''} />
                <input name="projectTags" placeholder="Laravel, MySQL, Docker" defaultValue={block.data.projects[i]?.tags.join(', ') ?? ''} />
                <input name="projectLinkLabel" placeholder="View Project" defaultValue={block.data.projects[i]?.linkLabel ?? ''} />
                <input name="projectLinkHref" placeholder="https://..." defaultValue={block.data.projects[i]?.linkHref ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the title to remove a project.</span>
        </>
      );

    case 'timeline':
      return (
        <>
          <label>
            Title
            <input name="title" defaultValue={block.data.title} />
          </label>
          <label>
            Icon
            <IconSelect name="icon" value={block.data.icon} />
          </label>
          <RepeatingRows
            initialCount={block.data.entries.length + 1}
            addLabel="+ add entry"
            renderRow={(i) => (
              <>
                <input name="entryPeriod" placeholder="2014 - Present" defaultValue={block.data.entries[i]?.period ?? ''} />
                <input name="entryTitle" placeholder="Role or degree" defaultValue={block.data.entries[i]?.title ?? ''} />
                <textarea name="entryDescription" rows={2} placeholder="Description" defaultValue={block.data.entries[i]?.description ?? ''} />
                <input name="entryTags" placeholder="PHP, Laravel, React" defaultValue={block.data.entries[i]?.tags.join(', ') ?? ''} />
                <input name="entryLinkLabel" placeholder="Link text" defaultValue={block.data.entries[i]?.linkLabel ?? ''} />
                <input name="entryLinkHref" placeholder="https://..." defaultValue={block.data.entries[i]?.linkHref ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the title to remove an entry.</span>
        </>
      );

    case 'skill_list':
      return (
        <>
          <label>
            Title
            <input name="title" defaultValue={block.data.title} />
          </label>
          <RepeatingRows
            initialCount={block.data.skills.length + 1}
            addLabel="+ add skill"
            renderRow={(i) => (
              <>
                <input name="skillName" placeholder="Name" defaultValue={block.data.skills[i]?.name ?? ''} />
                <input name="skillLevel" type="number" min={1} max={5} placeholder="1-5" defaultValue={block.data.skills[i]?.level ?? 3} />
                <input name="skillLabel" placeholder="Label" defaultValue={block.data.skills[i]?.label ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the name to remove a row.</span>
        </>
      );

    case 'fact_list':
      return (
        <>
          <label>
            Title (optional)
            <input name="title" defaultValue={block.data.title ?? ''} />
          </label>
          <RepeatingRows
            initialCount={block.data.facts.length + 1}
            addLabel="+ add fact"
            renderRow={(i) => (
              <>
                <input name="factLabel" placeholder="Label" defaultValue={block.data.facts[i]?.label ?? ''} />
                <input name="factValue" placeholder="Value" defaultValue={block.data.facts[i]?.value ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the label to remove a row. {'{{age}}'} works here too.</span>
        </>
      );

    case 'quote':
      return (
        <>
          <label>
            Quote
            <textarea name="text" rows={3} defaultValue={block.data.text} />
          </label>
          <label>
            Attribution
            <input name="attribution" defaultValue={block.data.attribution ?? ''} />
          </label>
        </>
      );

    case 'image':
      return (
        <>
          <label>
            Source
            <input name="src" defaultValue={block.data.src} />
          </label>
          <label>
            Alt text
            <input name="alt" defaultValue={block.data.alt} />
          </label>
          <label>
            Caption (optional)
            <input name="caption" defaultValue={block.data.caption ?? ''} />
          </label>
        </>
      );

    case 'contact_form':
      return (
        <>
          <label>
            Title
            <input name="title" defaultValue={block.data.title ?? ''} placeholder="Send me a message" />
          </label>
          <label>
            Intro
            <input name="intro" defaultValue={block.data.intro ?? ''} />
          </label>
          <label>
            Subject options
            <input name="subjects" defaultValue={block.data.subjects.join(', ')} placeholder="New project, Job opportunity, Something else" />
            <span className="hint">Comma separated. Leave blank to hide the dropdown.</span>
          </label>
          <label>
            Footnote
            <input name="footnote" defaultValue={block.data.footnote ?? ''} />
          </label>
        </>
      );
  }
};
