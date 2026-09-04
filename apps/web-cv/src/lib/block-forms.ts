import type { BlockData, BlockDataMap, BlockType, SkillLevel } from '@/lib/blocks';
import { sanitizeRichText } from '@/lib/sanitize';

const text = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();

/**
 * Repeating groups arrive as parallel arrays (name[], level[], ...). Rows
 * whose first field is blank are dropped, which is how a row is deleted.
 */
const rows = (data: FormData, key: string): string[] =>
  data.getAll(key).map((value) => String(value).trim());

const clampLevel = (value: string): SkillLevel => {
  const parsed = Number(value);
  const bounded = Math.min(5, Math.max(1, Number.isFinite(parsed) ? parsed : 1));

  return Math.round(bounded) as SkillLevel;
};

export const defaultBlockData = (type: BlockType): BlockData => {
  switch (type) {
    case 'heading':
      return { text: 'New heading', level: 2 };
    case 'rich_text':
      return { html: '<p>New paragraph.</p>' };
    case 'skill_list':
      return { title: 'Skills', skills: [] };
    case 'timeline':
      return { title: 'Timeline', entries: [] };
    case 'fact_list':
      return { title: '', facts: [] };
    case 'image':
      return { src: '/images/me.jpg', alt: '' };
    case 'contact_form':
      return { intro: '' };
  }
};

export const parseBlockForm = (type: BlockType, data: FormData): BlockData => {
  switch (type) {
    case 'heading':
      return {
        text: text(data, 'text'),
        level: text(data, 'level') === '3' ? 3 : 2,
      } satisfies BlockDataMap['heading'];

    case 'rich_text':
      return { html: sanitizeRichText(text(data, 'html')) } satisfies BlockDataMap['rich_text'];

    case 'skill_list': {
      const names = rows(data, 'skillName');
      const levels = rows(data, 'skillLevel');
      const labels = rows(data, 'skillLabel');

      return {
        title: text(data, 'title'),
        skills: names
          .map((name, i) => ({
            name,
            level: clampLevel(levels[i] ?? '1'),
            label: labels[i] ?? '',
          }))
          .filter((skill) => skill.name.length > 0),
      } satisfies BlockDataMap['skill_list'];
    }

    case 'timeline': {
      const periods = rows(data, 'entryPeriod');
      const titles = rows(data, 'entryTitle');
      const descriptions = rows(data, 'entryDescription');

      return {
        title: text(data, 'title'),
        entries: titles
          .map((entryTitle, i) => ({
            period: periods[i] ?? '',
            title: entryTitle,
            description: descriptions[i] ?? '',
          }))
          .filter((entry) => entry.title.length > 0),
      } satisfies BlockDataMap['timeline'];
    }

    case 'fact_list': {
      const labels = rows(data, 'factLabel');
      const values = rows(data, 'factValue');

      return {
        title: text(data, 'title'),
        facts: labels
          .map((label, i) => ({ label, value: values[i] ?? '' }))
          .filter((fact) => fact.label.length > 0),
      } satisfies BlockDataMap['fact_list'];
    }

    case 'image':
      return {
        src: text(data, 'src'),
        alt: text(data, 'alt'),
        caption: text(data, 'caption') || undefined,
      } satisfies BlockDataMap['image'];

    case 'contact_form':
      return { intro: text(data, 'intro') || undefined } satisfies BlockDataMap['contact_form'];
  }
};
