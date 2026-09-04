/**
 * Block types drive both rendering and which form the editor shows. Adding a
 * type means one renderer and one editor form - nothing else changes.
 */
export const BLOCK_TYPES = [
  'hero',
  'rich_text',
  'heading',
  'card_grid',
  'pill_group',
  'info_list',
  'project_grid',
  'timeline',
  'skill_list',
  'fact_list',
  'quote',
  'image',
  'contact_form',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type SkillEntry = { name: string; level: SkillLevel; label: string };

export type Fact = { label: string; value: string };

export type TimelineEntry = {
  period: string;
  title: string;
  description: string;
  /** Comma-separated in the editor, rendered as accent text under the entry. */
  tags: string[];
  linkLabel?: string;
  linkHref?: string;
};

export type Card = {
  icon: string;
  /** Large figure above the title, as on About's "14+ Years Experience". */
  stat?: string;
  title: string;
  text: string;
};

export type Pill = { label: string; icon?: string };

export type InfoItem = { icon: string; title: string; text: string };

export type Project = {
  image?: string;
  title: string;
  text: string;
  tags: string[];
  linkLabel?: string;
  linkHref?: string;
};

export type BlockDataMap = {
  hero: {
    eyebrow?: string;
    titleLead: string;
    /** Rendered in the accent colour beside titleLead. */
    titleAccent?: string;
    subtitle?: string;
    body?: string;
    primaryLabel?: string;
    primaryHref?: string;
    primaryIcon?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    secondaryIcon?: string;
    image?: string;
    /** Handwritten-style words over the image, one per line. */
    script?: string;
  };
  rich_text: { html: string };
  heading: { text: string; level: 2 | 3 };
  card_grid: { title?: string; columns: 2 | 3 | 4 | 5; cards: Card[] };
  pill_group: { title?: string; linkLabel?: string; linkHref?: string; pills: Pill[] };
  info_list: { title?: string; boxed: boolean; items: InfoItem[] };
  project_grid: { columns: 2 | 3 | 4; projects: Project[] };
  timeline: { title: string; icon?: string; entries: TimelineEntry[] };
  skill_list: { title: string; skills: SkillEntry[] };
  fact_list: { title?: string; facts: Fact[] };
  quote: { text: string; attribution?: string };
  image: { src: string; alt: string; caption?: string };
  contact_form: {
    title?: string;
    intro?: string;
    subjects: string[];
    footnote?: string;
  };
};

export type BlockData = BlockDataMap[BlockType];

/**
 * A block row whose `type` and `data` are correlated. The database stores them
 * as independent columns, so TypeScript cannot narrow one from the other on
 * the raw row - the query layer asserts this shape once, at the boundary where
 * untyped JSON becomes typed.
 */
export type TypedBlockFields = {
  [K in BlockType]: { type: K; data: BlockDataMap[K] };
}[BlockType];

export const isBlockType = (value: string): value is BlockType =>
  (BLOCK_TYPES as readonly string[]).includes(value);
