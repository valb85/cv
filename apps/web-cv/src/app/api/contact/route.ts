import { getDb } from '@/db/client';
import { messages } from '@/db/schema';
import { clientIp } from '@/lib/client-ip';
import { validateContact } from '@/lib/contact';
import { checkFormToken, countLinks, isRateLimited, verifyTurnstile } from '@/lib/contact-guard';
import { getContactSettings } from '@/lib/contact-settings';

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
 *
 * The spam checks run cheapest first, so the network call to Cloudflare only
 * happens for a submission that passed everything local. See
 * src/lib/contact-guard.ts for what each layer stops.
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

  // Read per submission, so a change under Admin -> Settings applies at once.
  const limits = getContactSettings();

  switch (checkFormToken(field(data, 'form_token'), limits.minFillSeconds)) {
    case 'ok':
      break;
    case 'too-fast':
      return respond(request, false, 'That was quick - please check your message and send it again.');
    case 'expired':
      return respond(request, false, 'This form has been open too long. Reload the page and send again.');
    case 'invalid':
      return respond(request, false, 'Please send your message from the contact page.');
  }

  const ip = clientIp(request.headers);

  if (isRateLimited(ip, limits)) {
    return respond(request, false, 'Too many messages from your network. Please try again later.');
  }

  if (limits.maxLinks !== null && countLinks(result.value.name, result.value.body) > limits.maxLinks) {
    return respond(
      request,
      false,
      limits.maxLinks === 0
        ? 'Please send your message without links.'
        : `Please include at most ${limits.maxLinks} ${limits.maxLinks === 1 ? 'link' : 'links'} in your message.`,
    );
  }

  switch (await verifyTurnstile(field(data, 'cf-turnstile-response'), ip)) {
    case 'ok':
    case 'disabled':
      break;
    case 'missing':
    case 'failed':
      return respond(request, false, 'Please complete the human check and send again.');
    case 'unavailable':
      return respond(request, false, 'The human check could not be verified right now. Please try again.');
  }

  const subject = field(data, 'subject').trim();

  getDb()
    .insert(messages)
    .values({
      name: result.value.name,
      email: result.value.email,
      body: subject ? `[${subject}]\n\n${result.value.body}` : result.value.body,
      ip,
      userAgent: request.headers.get('user-agent'),
    })
    .run();

  return respond(request, true);
}
