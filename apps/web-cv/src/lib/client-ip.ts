/**
 * The caller's IP, for rate limits and lockouts.
 *
 * Each proxy *appends* the address it received the request from to
 * X-Forwarded-For, so only the entries our own proxies added can be trusted.
 * Anything to their left - and X-Real-IP, which nothing here sets in
 * production - is whatever the client chose to send. Reading the first entry
 * let any client pick its own rate-limit key.
 *
 * TRUSTED_PROXY_HOPS is how many of our proxies sit in front of Node:
 * - 1 (default): production, Apache -> Node. The last entry is the client.
 * - 2: Docker dev, Caddy -> Apache -> Node. Caddy writes the client into the
 *   header, Apache appends Caddy's address, so the client is second to last.
 */
const env = process.env as Record<string, string | undefined>;

const trustedHops = (): number => {
  const parsed = Number(env.TRUSTED_PROXY_HOPS ?? 1);

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
};

/**
 * Some proxies write `ip:port` (Caddy's {remote} does), which would make every
 * request from one client look like a new one to a rate limit. Strips the port
 * from `1.2.3.4:5678` and `[::1]:5678`; a bare IPv6 address is left alone.
 */
const withoutPort = (entry: string): string => {
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(entry);

  if (bracketed) {
    return bracketed[1];
  }

  const v4 = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(entry);

  return v4 ? v4[1] : entry;
};

export const clientIp = (headers: Headers): string => {
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((part) => withoutPort(part.trim()))
    .filter(Boolean);

  // Fewer entries than hops means the request did not come through the
  // proxies at all (a local call); the leftmost is then the best we have.
  return chain[Math.max(chain.length - trustedHops(), 0)] ?? 'unknown';
};
