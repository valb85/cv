import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { and, eq, gt, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { messages } from '@/db/schema';
import type { ContactSettings } from '@/lib/contact-settings';

/**
 * Layers that keep the contact form for people. Each one stops a different
 * kind of sender; none of them alone proves a human:
 *
 * 1. form token  - signed when the page renders, so a script posting straight
 *                  to /api/contact without loading the page is refused;
 * 2. fill time   - a token younger than the minimum fill time means the form
 *                  was filled faster than anyone types;
 * 3. rate limit  - per IP, counted from stored messages so it survives restarts;
 * 4. link cap    - link-stuffed messages are the bulk of contact-form spam;
 * 5. Turnstile   - Cloudflare's check that a real browser with a person at it
 *                  submitted, verified server-side with the secret key.
 *
 * The honeypot field (src/lib/contact.ts) runs before all of these.
 */

const env = process.env as Record<string, string | undefined>;

// The tunable limits (rate limits, fill time, links) live in the settings
// table - Admin -> Settings -> Contact form, see src/lib/contact-settings.ts.
// The token lifetime is not a spam knob, so it stays fixed here.
const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------- 1 + 2: signed form token ---------- */

const tokenSecret = (): string => {
  const secret = env.SESSION_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short; cannot sign contact form tokens.');
  }

  return secret;
};

const sign = (payload: string): string =>
  createHmac('sha256', tokenSecret()).update(`contact:${payload}`).digest('base64url');

/** A token for one rendering of the contact form: `<issuedAt>.<nonce>.<mac>`. */
export const issueFormToken = (): string => {
  const payload = `${Date.now()}.${randomBytes(9).toString('base64url')}`;

  return `${payload}.${sign(payload)}`;
};

export type TokenCheck = 'ok' | 'invalid' | 'too-fast' | 'expired';

export const checkFormToken = (token: string, minFillSeconds: number, now = Date.now()): TokenCheck => {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return 'invalid';
  }

  const [issued, nonce, mac] = parts;
  const expected = Buffer.from(sign(`${issued}.${nonce}`));
  const given = Buffer.from(mac);

  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return 'invalid';
  }

  const age = now - Number(issued);

  if (!Number.isFinite(age) || age < 0) {
    return 'invalid';
  }

  if (age < minFillSeconds * 1000) {
    return 'too-fast';
  }

  return age > MAX_TOKEN_AGE_MS ? 'expired' : 'ok';
};

/* ---------- 3: rate limit ---------- */

/**
 * True when this IP has already sent as many messages as a window allows.
 * A window whose max is 0 is switched off.
 */
export const isRateLimited = (ip: string, limits: ContactSettings, now = Date.now()): boolean =>
  [
    { windowMs: limits.shortWindowMinutes * 60 * 1000, max: limits.shortMax },
    { windowMs: DAY_MS, max: limits.dailyMax },
  ].some(({ windowMs, max }) => {
    if (max <= 0) {
      return false;
    }

    const since = new Date(now - windowMs);
    const row = getDb()
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.ip, ip), gt(messages.createdAt, since)))
      .get();

    return (row?.count ?? 0) >= max;
  });

/* ---------- 4: link cap ---------- */

const LINK = /\bhttps?:\/\/|\bwww\.|\[url=|<a\s/gi;

export const countLinks = (...texts: string[]): number =>
  texts.reduce((total, text) => total + (text.match(LINK)?.length ?? 0), 0);

/* ---------- 5: Cloudflare Turnstile ---------- */

let warnedUnconfigured = false;

/** The public site key, or null when Turnstile is not configured. */
export const turnstileSiteKey = (): string | null => env.TURNSTILE_SITE_KEY?.trim() || null;

const turnstileSecret = (): string | null => env.TURNSTILE_SECRET_KEY?.trim() || null;

export type TurnstileCheck = 'ok' | 'disabled' | 'missing' | 'failed' | 'unavailable';

/**
 * Asks Cloudflare whether the widget's token is genuine. Without both keys the
 * check is skipped - and logged once - so the form keeps working (on the other
 * layers) on an install that has not set Turnstile up yet.
 */
export const verifyTurnstile = async (token: string, ip: string): Promise<TurnstileCheck> => {
  const secret = turnstileSecret();

  if (!secret || !turnstileSiteKey()) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn('[contact] TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY not set; human check is off.');
    }

    return 'disabled';
  }

  if (!token) {
    return 'missing';
  }

  const body = new URLSearchParams({ secret, response: token });

  if (ip !== 'unknown') {
    body.set('remoteip', ip);
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };

    if (result.success === true) {
      return 'ok';
    }

    console.warn('[contact] Turnstile rejected a submission:', result['error-codes']?.join(', '));

    return 'failed';
  } catch (error) {
    console.error('[contact] Turnstile verification unreachable:', error);

    return 'unavailable';
  }
};
