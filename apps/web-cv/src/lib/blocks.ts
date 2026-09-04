/**
 * Block types drive both rendering and which form the editor shows. Adding a
 * type means one renderer and one editor form - nothing else changes.
 */
export const BLOCK_TYPES = [
  'rich_text',
  'heading',
  'skill_list',
  'timeline',
  'image',
  'contact_form',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type SkillEntry = {
  name: string;
  level: SkillLevel;
  label: string;
};

export type TimelineEntry = {
  period: string;
  title: string;
  description: string;
};

export type BlockDataMap = {
  rich_text: { html: string };
  heading: { text: string; level: 2 | 3 };
  skill_list: { title: string; skills: SkillEntry[] };
  timeline: { title: string; entries: TimelineEntry[] };
  image: { src: string; alt: string; caption?: string };
  contact_form: { intro?: string };
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
