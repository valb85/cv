import { getCurrentUser } from '@/lib/auth';
import { getCvDocument } from '@/lib/cv';
import { toCvExport } from '@/lib/cv-document';

export const dynamic = 'force-dynamic';

/**
 * Downloads the CV as JSON, to move it between environments (edit on dev,
 * import on production) or keep a copy. Exports what the editor shows: the
 * saved CV, or the draft imported from the site until the first save.
 *
 * Route handlers do not run the (protected) layout's login check, so this one
 * checks the session itself - and answers 404 rather than 401, the same as
 * any other admin URL to someone who is not signed in.
 */
export const GET = async (): Promise<Response> => {
  if (!(await getCurrentUser())) {
    return new Response('Not found', { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);

  return new Response(`${JSON.stringify(toCvExport(getCvDocument()), null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="cv-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
};
