import { randomUUID } from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';

import { adminBasePath, INTERNAL_ADMIN_PATH } from '@/lib/admin-path';

// Next 16's replacement for middleware.ts. It matters here that a proxy always
// runs on the Node runtime: ADMIN_PATH is read out of /etc/cv.env when the
// service starts, long after the edge bundle would have been compiled.
export const config = {
  matcher: ['/((?!_next/static|_next/image|uploads|favicon.ico).*)'],
};

const under = (pathname: string, base: string): boolean =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * The standalone server runs the proxy again on the URL it was just rewritten
 * to - `next dev` does not - so the second pass arrives at /admin and the rule
 * below buries the rewrite this proxy had only just made. Nothing in the
 * incoming headers distinguishes that pass from a real request for /admin, so
 * the rewrite marks itself.
 *
 * The marker is a token minted per process rather than a fixed string,
 * because a header a caller could guess would let anyone skip straight past
 * the burial to the login form - which is the entire point of ADMIN_PATH.
 */
const REENTRY_HEADER = 'x-admin-rewrite';
const REENTRY_TOKEN = randomUUID();

/**
 * A rewrite target on this server itself. Next builds request.nextUrl with the
 * scheme from X-Forwarded-Proto, so behind Apache on HTTPS it says `https:` -
 * but the Node server only speaks plain HTTP. A rewrite whose origin differs
 * from the server's own is treated as an external URL and proxied, so Next
 * opened TLS to its own HTTP port and every admin request failed with EPROTO
 * (500). The search string is kept; only the scheme and path change.
 */
const internalUrl = (request: NextRequest, pathname: string): URL => {
  const url = request.nextUrl.clone();

  url.protocol = 'http:';
  url.pathname = pathname;

  return url;
};

/**
 * A slug that cannot exist - `createPage` strips everything outside [a-z0-9-] -
 * so `[slug]` renders the site's own 404 page, with a real 404 status. Next
 * streams the rewrite target in the RSC payload, so the response is not quite
 * byte-identical to any other dead URL; what it never contains is ADMIN_PATH.
 */
const notFound = (request: NextRequest): NextResponse =>
  NextResponse.rewrite(internalUrl(request, '/_missing'));

export const proxy = (request: NextRequest): NextResponse => {
  const { pathname } = request.nextUrl;

  // The marker only vouches for a request already on the internal path. A
  // server action that calls redirect() renders its target with a second
  // request carrying a copy of the action request's headers - marker included
  // - but for the public path. Trusting the marker there skipped the rewrite,
  // so every admin redirect (login, logout, create/delete page, CV reset)
  // rendered the 404 page.
  if (request.headers.get(REENTRY_HEADER) === REENTRY_TOKEN && under(pathname, INTERNAL_ADMIN_PATH)) {
    return NextResponse.next();
  }

  let base: string;

  try {
    base = adminBasePath();
  } catch (error) {
    // A malformed ADMIN_PATH takes the admin offline rather than quietly
    // falling back to /admin. The public site carries on regardless.
    console.error(error);

    return under(pathname, INTERNAL_ADMIN_PATH) ? notFound(request) : NextResponse.next();
  }

  if (base === INTERNAL_ADMIN_PATH) {
    return NextResponse.next();
  }

  if (under(pathname, INTERNAL_ADMIN_PATH)) {
    return notFound(request);
  }

  if (under(pathname, base)) {
    const url = internalUrl(request, `${INTERNAL_ADMIN_PATH}${pathname.slice(base.length)}`);
    const headers = new Headers(request.headers);

    headers.set(REENTRY_HEADER, REENTRY_TOKEN);

    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next();
};
