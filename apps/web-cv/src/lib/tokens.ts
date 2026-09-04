import { calculateAge } from '@/lib/age';
import { getSetting } from '@/lib/settings';

export type Tokens = Record<string, string>;

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Values that change on their own and must not be frozen into stored text.
 * Age is the only one so far: the birth date lives in settings so it stays
 * editable, and the number is derived per request.
 */
export const buildTokens = (): Tokens => {
  const birthDate = getSetting('birth_date');

  if (!birthDate) {
    return {};
  }

  const parsed = new Date(`${birthDate}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return {};
  }

  return { age: String(calculateAge(parsed)) };
};

export const applyTokens = (text: string, tokens: Tokens): string =>
  text.replace(TOKEN_PATTERN, (match, name: string) => tokens[name] ?? match);
