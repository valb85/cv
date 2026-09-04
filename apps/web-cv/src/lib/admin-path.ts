/**
 * The admin route files live at `/admin` and always will - that is an
 * implementation detail. What the browser sees is ADMIN_PATH, and middleware
 * rewrites one onto the other while 404-ing `/admin` itself.
 *
 * Every admin link, redirect and revalidation has to go through here. Hardcode
 * `/admin` anywhere and the link lands on the path middleware just buried.
 *
 * The value is read through an alias rather than as a literal
 * `process.env.ADMIN_PATH`, because that exact expression can be substituted
 * at build time in the bundles Next compiles ahead of the server starting -
 * and this value does not exist until runtime, in /etc/cv.env.
 */
const env = process.env as Record<string, string | undefined>;

export const INTERNAL_ADMIN_PATH = '/admin';

// One segment, three characters or more. Deliberately narrow: the path ends up
// in a rewrite target, so anything with a slash or a dot in it is a mistake.
const SEGMENT = /^\/[a-z0-9][a-z0-9_-]{2,63}$/i;

/**
 * Throws on a configured-but-malformed value. Silently serving `/admin`
 * because of a typo in the env file is the one outcome worth an exception -
 * the caller in middleware catches it and takes the admin offline instead.
 */
export const adminBasePath = (): string => {
  const configured = env.ADMIN_PATH?.trim().replace(/\/+$/, '');

  if (!configured) {
    return INTERNAL_ADMIN_PATH;
  }

  if (!SEGMENT.test(configured)) {
    throw new Error(
      `ADMIN_PATH must be a single path segment such as /a7f3c1-console; got ${JSON.stringify(configured)}.`,
    );
  }

  return configured;
};

export const adminPath = (suffix = ''): string => `${adminBasePath()}${suffix}`;
