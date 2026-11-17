import { getAllSettings } from '@/lib/settings';

/**
 * Contact form spam limits, edited under Admin -> Settings -> Contact form and
 * stored in the `settings` table, so they change without a redeploy. Read on
 * every submission; a missing or unreadable value falls back to its default.
 *
 * 0 turns a rule off (no rate limit / no minimum fill time). For links, 0
 * means "no links allowed", so it has its own off switch: leave it empty.
 */
export type ContactSettings = {
  /** Messages allowed per IP within `shortWindowMinutes`. 0 = no limit. */
  shortMax: number;
  shortWindowMinutes: number;
  /** Messages allowed per IP per 24 hours. 0 = no limit. */
  dailyMax: number;
  /** Seconds between page load and send; faster is refused. 0 = off. */
  minFillSeconds: number;
  /** Links allowed per message, or null for no link limit. */
  maxLinks: number | null;
};

export type ContactSettingField = {
  key: string;
  prop: keyof ContactSettings;
  label: string;
  hint: string;
  min: number;
  max: number;
  fallback: number | null;
  /** Empty input is accepted and stored as "no limit". */
  optional?: boolean;
};

export const CONTACT_SETTING_FIELDS: ContactSettingField[] = [
  {
    key: 'contact_short_max',
    prop: 'shortMax',
    label: 'Messages per short window',
    hint: 'How many messages one IP may send within the window below. 0 = no limit.',
    min: 0,
    max: 100,
    fallback: 3,
  },
  {
    key: 'contact_short_window_minutes',
    prop: 'shortWindowMinutes',
    label: 'Short window (minutes)',
    hint: '1 to 1440 (24 hours).',
    min: 1,
    max: 1440,
    fallback: 10,
  },
  {
    key: 'contact_daily_max',
    prop: 'dailyMax',
    label: 'Messages per day',
    hint: 'How many messages one IP may send in 24 hours. 0 = no limit.',
    min: 0,
    max: 1000,
    fallback: 10,
  },
  {
    key: 'contact_min_fill_seconds',
    prop: 'minFillSeconds',
    label: 'Minimum time to fill in (seconds)',
    hint: 'A message sent faster than this after the page loads is refused. 0 = off.',
    min: 0,
    max: 60,
    fallback: 3,
  },
  {
    key: 'contact_max_links',
    prop: 'maxLinks',
    label: 'Links allowed per message',
    hint: '0 = no links at all. Leave empty for no link limit.',
    min: 0,
    max: 50,
    fallback: 2,
    optional: true,
  },
];

/** The stored text of one field: an integer within range, '' (if optional), or an error. */
export const parseContactSetting = (
  field: ContactSettingField,
  raw: string,
): { ok: true; value: string } | { ok: false; error: string } => {
  const text = raw.trim();

  if (text === '' && field.optional) {
    return { ok: true, value: '' };
  }

  if (!/^\d+$/.test(text)) {
    return { ok: false, error: `${field.label}: enter a whole number.` };
  }

  const value = Number(text);

  if (value < field.min || value > field.max) {
    return { ok: false, error: `${field.label}: must be between ${field.min} and ${field.max}.` };
  }

  return { ok: true, value: String(value) };
};

const readField = (field: ContactSettingField, stored: string | undefined): number | null => {
  // Never saved: the default. A stored empty optional field means "no limit".
  if (stored === undefined) {
    return field.fallback;
  }

  const parsed = parseContactSetting(field, stored);

  if (!parsed.ok) {
    return field.fallback;
  }

  return parsed.value === '' ? null : Number(parsed.value);
};

export const getContactSettings = (settings = getAllSettings()): ContactSettings => {
  const out = {} as Record<keyof ContactSettings, number | null>;

  for (const field of CONTACT_SETTING_FIELDS) {
    out[field.prop] = readField(field, settings[field.key]);
  }

  return {
    shortMax: out.shortMax ?? 0,
    shortWindowMinutes: out.shortWindowMinutes ?? 10,
    dailyMax: out.dailyMax ?? 0,
    minFillSeconds: out.minFillSeconds ?? 0,
    maxLinks: out.maxLinks,
  };
};
