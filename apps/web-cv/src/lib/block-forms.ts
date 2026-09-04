import type { BlockData, BlockDataMap, BlockType, SkillLevel } from '@/lib/blocks';
import { sanitizeRichText } from '@/lib/sanitize';

const text = (data: FormData, key: string): string => String(data.get(key) ?? '').trim();

/**
 * Repeating groups arrive as parallel arrays (title[], text[], ...). Rows whose
 * key field is blank are dropped, which is how a row is deleted.
 */
const rows = (data: FormData, key: string): string[] =>
  data.getAll(key).map((value) => String(value).trim());

/** Comma-separated free text, used for tag and option lists. */
const list = (value: string): string[] =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const clampLevel = (value: string): SkillLevel => {
  const parsed = Number(value);
  const bounded = Math.min(5, Math.max(1, Number.isFinite(parsed) ? parsed : 1));

  return Math.round(bounded) as SkillLevel;
};

const columns = <T extends number>(value: string, allowed: T[], fallback: T): T => {
  const parsed = Number(value);

  return (allowed as number[]).includes(parsed) ? (parsed as T) : fallback;
};

export const defaultBlockData = (type: BlockType): BlockData => {
  switch (type) {
    case 'hero':
      return { titleLead: 'Title', titleAccent: 'Here' };
    case 'heading':
      return { text: 'New heading', level: 2 };
    case 'rich_text':
      return { html: '<p>New paragraph.</p>' };
    case 'card_grid':
      return { columns: 4, cards: [] };
    case 'pill_group':
      return { pills: [] };
    case 'info_list':
      return { boxed: true, items: [] };
    case 'project_grid':
      return { columns: 4, projects: [] };
    case 'timeline':
      return { title: 'Timeline', entries: [] };
    case 'skill_list':
      return { title: 'Skills', skills: [] };
    case 'fact_list':
      return { facts: [] };
    case 'quote':
      return { text: 'A quote.' };
    case 'image':
      return { src: '/images/me.jpg', alt: '' };
    case 'contact_form':
      return { subjects: [] };
  }
};

export const parseBlockForm = (type: BlockType, data: FormData): BlockData => {
  switch (type) {
    case 'hero':
      return {
        eyebrow: text(data, 'eyebrow') || undefined,
        titleLead: text(data, 'titleLead'),
        titleAccent: text(data, 'titleAccent') || undefined,
        subtitle: text(data, 'subtitle') || undefined,
        body: text(data, 'body') || undefined,
        primaryLabel: text(data, 'primaryLabel') || undefined,
        primaryHref: text(data, 'primaryHref') || undefined,
        primaryIcon: text(data, 'primaryIcon') || undefined,
        secondaryLabel: text(data, 'secondaryLabel') || undefined,
        secondaryHref: text(data, 'secondaryHref') || undefined,
        secondaryIcon: text(data, 'secondaryIcon') || undefined,
        image: text(data, 'image') || undefined,
        script: text(data, 'script') || undefined,
      } satisfies BlockDataMap['hero'];

    case 'heading':
      return {
        text: text(data, 'text'),
        level: text(data, 'level') === '3' ? 3 : 2,
      } satisfies BlockDataMap['heading'];

    case 'rich_text':
      return { html: sanitizeRichText(text(data, 'html')) } satisfies BlockDataMap['rich_text'];

    case 'card_grid': {
      const icons = rows(data, 'cardIcon');
      const stats = rows(data, 'cardStat');
      const titles = rows(data, 'cardTitle');
      const texts = rows(data, 'cardText');

      return {
        title: text(data, 'title') || undefined,
        columns: columns(text(data, 'columns'), [2, 3, 4, 5] as const, 4),
        cards: titles
          .map((title, i) => ({
            icon: icons[i] ?? '',
            stat: stats[i] || undefined,
            title,
            text: texts[i] ?? '',
          }))
          .filter((card) => card.title.length > 0),
      } satisfies BlockDataMap['card_grid'];
    }

    case 'pill_group': {
      const labels = rows(data, 'pillLabel');
      const icons = rows(data, 'pillIcon');

      return {
        title: text(data, 'title') || undefined,
        linkLabel: text(data, 'linkLabel') || undefined,
        linkHref: text(data, 'linkHref') || undefined,
        pills: labels
          .map((label, i) => ({ label, icon: icons[i] || undefined }))
          .filter((pill) => pill.label.length > 0),
      } satisfies BlockDataMap['pill_group'];
    }

    case 'info_list': {
      const icons = rows(data, 'itemIcon');
      const titles = rows(data, 'itemTitle');
      const texts = rows(data, 'itemText');

      return {
        title: text(data, 'title') || undefined,
        boxed: data.get('boxed') === 'on',
        items: titles
          .map((title, i) => ({ icon: icons[i] ?? '', title, text: texts[i] ?? '' }))
          .filter((item) => item.title.length > 0),
      } satisfies BlockDataMap['info_list'];
    }

    case 'project_grid': {
      const images = rows(data, 'projectImage');
      const titles = rows(data, 'projectTitle');
      const texts = rows(data, 'projectText');
      const tags = rows(data, 'projectTags');
      const linkLabels = rows(data, 'projectLinkLabel');
      const linkHrefs = rows(data, 'projectLinkHref');

      return {
        columns: columns(text(data, 'columns'), [2, 3, 4] as const, 4),
        projects: titles
          .map((title, i) => ({
            image: images[i] || undefined,
            title,
            text: texts[i] ?? '',
            tags: list(tags[i] ?? ''),
            linkLabel: linkLabels[i] || undefined,
            linkHref: linkHrefs[i] || undefined,
          }))
          .filter((project) => project.title.length > 0),
      } satisfies BlockDataMap['project_grid'];
    }

    case 'timeline': {
      const periods = rows(data, 'entryPeriod');
      const titles = rows(data, 'entryTitle');
      const descriptions = rows(data, 'entryDescription');
      const tags = rows(data, 'entryTags');
      const linkLabels = rows(data, 'entryLinkLabel');
      const linkHrefs = rows(data, 'entryLinkHref');

      return {
        title: text(data, 'title'),
        icon: text(data, 'icon') || undefined,
        entries: titles
          .map((entryTitle, i) => ({
            period: periods[i] ?? '',
            title: entryTitle,
            description: descriptions[i] ?? '',
            tags: list(tags[i] ?? ''),
            linkLabel: linkLabels[i] || undefined,
            linkHref: linkHrefs[i] || undefined,
          }))
          .filter((entry) => entry.title.length > 0),
      } satisfies BlockDataMap['timeline'];
    }

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

    case 'fact_list': {
      const labels = rows(data, 'factLabel');
      const values = rows(data, 'factValue');

      return {
        title: text(data, 'title') || undefined,
        facts: labels
          .map((label, i) => ({ label, value: values[i] ?? '' }))
          .filter((fact) => fact.label.length > 0),
      } satisfies BlockDataMap['fact_list'];
    }

    case 'quote':
      return {
        text: text(data, 'text'),
        attribution: text(data, 'attribution') || undefined,
      } satisfies BlockDataMap['quote'];

    case 'image':
      return {
        src: text(data, 'src'),
        alt: text(data, 'alt'),
        caption: text(data, 'caption') || undefined,
      } satisfies BlockDataMap['image'];

    case 'contact_form':
      return {
        title: text(data, 'title') || undefined,
        intro: text(data, 'intro') || undefined,
        subjects: list(text(data, 'subjects')),
        footnote: text(data, 'footnote') || undefined,
      } satisfies BlockDataMap['contact_form'];
  }
};
