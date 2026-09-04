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
 * A slug that cannot exist - `createPage` strips everything outside [a-z0-9-] -
 * so `[slug]` renders the site's own 404 page, with a real 404 status. Next
 * streams the rewrite target in the RSC payload, so the response is not quite
 * byte-identical to any other dead URL; what it never contains is ADMIN_PATH.
 */
const notFound = (request: NextRequest): NextResponse =>
  NextResponse.rewrite(new URL('/_missing', request.url));

export const proxy = (request: NextRequest): NextResponse => {
  const { pathname } = request.nextUrl;

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

    url.pathname = `${INTERNAL_ADMIN_PATH}${pathname.slice(base.length)}`;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
};
