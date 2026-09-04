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
 * A slug that cannot exist - `createPage` strips everything outside [a-z0-9-] -
 * so `[slug]` renders the site's own 404 page, with a real 404 status. Next
 * streams the rewrite target in the RSC payload, so the response is not quite
 * byte-identical to any other dead URL; what it never contains is ADMIN_PATH.
 */
const notFound = (request: NextRequest): NextResponse =>
  NextResponse.rewrite(new URL('/_missing', request.url));

export const proxy = (request: NextRequest): NextResponse => {
  const { pathname } = request.nextUrl;

  if (request.headers.get(REENTRY_HEADER) === REENTRY_TOKEN) {
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
    const url = request.nextUrl.clone();
    const headers = new Headers(request.headers);

    url.pathname = `${INTERNAL_ADMIN_PATH}${pathname.slice(base.length)}`;
    headers.set(REENTRY_HEADER, REENTRY_TOKEN);

    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next();
};
