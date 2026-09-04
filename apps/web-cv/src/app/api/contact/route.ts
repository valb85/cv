import { getDb } from '@/db/client';
import { messages } from '@/db/schema';
import { validateContact } from '@/lib/contact';

export const dynamic = 'force-dynamic';

const field = (data: FormData, key: string): string => String(data.get(key) ?? '');

/** Form posts want a redirect back to the page; fetch callers want JSON. */
const wantsJson = (request: Request): boolean =>
  (request.headers.get('accept') ?? '').includes('application/json');

const respond = (request: Request, ok: boolean, error?: string): Response => {
  if (wantsJson(request)) {
    return Response.json(ok ? { ok } : { ok, error }, { status: ok ? 200 : 400 });
  }

  const referer = request.headers.get('referer') ?? '/';
  const target = new URL(referer);

  target.searchParams.set('contact', ok ? 'sent' : 'error');

  return Response.redirect(target, 303);
};

/**
 * Submissions are stored and read in the admin inbox only - nothing is
 * relayed by e-mail. There is no delivery step to fail, so a stored row is
 * the whole success condition.
 */
export async function POST(request: Request): Promise<Response> {
  let data: FormData;

  try {
    data = await request.formData();
  } catch {
    return respond(request, false, 'Could not read the submitted form.');
  }

  const result = validateContact({
    name: field(data, 'name'),
    email: field(data, 'email'),
    message: field(data, 'message'),
    website: field(data, 'website'),
  });

  if (!result.ok) {
    // A honeypot hit is reported as success so the sender does not retry.
    return result.error === 'spam' ? respond(request, true) : respond(request, false, result.error);
  }

  const subject = field(data, 'subject').trim();
  const headers = request.headers;

  getDb()
    .insert(messages)
    .values({
      name: result.value.name,
      email: result.value.email,
      body: subject ? `[${subject}]\n\n${result.value.body}` : result.value.body,
      ip: headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: headers.get('user-agent'),
    })
    .run();

  return respond(request, true);
}
