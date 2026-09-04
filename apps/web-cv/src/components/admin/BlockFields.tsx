'use client';

import type { RenderableBlock } from '@/lib/queries';

import { RepeatingRows } from './RepeatingRows';

export const BlockFields = ({ block }: { block: RenderableBlock }) => {
  switch (block.type) {
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
                <input
                  name="skillLevel"
                  type="number"
                  min={1}
                  max={5}
                  placeholder="1-5"
                  defaultValue={block.data.skills[i]?.level ?? 3}
                />
                <input name="skillLabel" placeholder="Label" defaultValue={block.data.skills[i]?.label ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the name to remove a row.</span>
        </>
      );

    case 'timeline':
      return (
        <>
          <label>
            Title
            <input name="title" defaultValue={block.data.title} />
          </label>
          <RepeatingRows
            initialCount={block.data.entries.length + 1}
            addLabel="+ add entry"
            renderRow={(i) => (
              <>
                <input name="entryPeriod" placeholder="2014 - Present" defaultValue={block.data.entries[i]?.period ?? ''} />
                <input name="entryTitle" placeholder="Role or degree" defaultValue={block.data.entries[i]?.title ?? ''} />
                <textarea name="entryDescription" rows={2} placeholder="Description" defaultValue={block.data.entries[i]?.description ?? ''} />
              </>
            )}
          />
          <span className="hint">Clear the title to remove an entry.</span>
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
        <label>
          Intro (optional)
          <input name="intro" defaultValue={block.data.intro ?? ''} />
        </label>
      );
  }
};
