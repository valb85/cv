/**
 * Failed sign-ins, held in memory. One systemd unit, one Node process, so a Map
 * is enough - and a restart forgiving everyone is an acceptable trade for not
 * putting a write on the hot path of every guess.
 *
 * The key is the caller's identity - an IP - which the caller supplies; this
 * module deliberately knows nothing about requests.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type Attempts = { count: number; firstAt: number; blockedUntil: number };

const attempts = new Map<string, Attempts>();

const prune = (now: number): void => {
  for (const [key, entry] of attempts) {
    if (now > entry.blockedUntil && now - entry.firstAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
};

/** Seconds left on the lockout, or 0 when the caller may attempt a sign-in. */
export const loginLockout = (key: string): number => {
  const entry = attempts.get(key);
  const now = Date.now();

  return entry && entry.blockedUntil > now ? Math.ceil((entry.blockedUntil - now) / 1000) : 0;
};

export const recordFailedLogin = (key: string): void => {
  const now = Date.now();

  prune(now);

  const entry = attempts.get(key);

  // A window that has run out starts over, so five wrong guesses spread across
  // an afternoon never add up to a lockout.
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, blockedUntil: 0 });

    return;
  }

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + LOCKOUT_MS;
    entry.count = 0;
    entry.firstAt = now;
  }
};

export const clearLoginAttempts = (key: string): void => {
  attempts.delete(key);
};
