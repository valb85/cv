import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { messages } from '@/db/schema';
import { validateContact } from '@/lib/contact';
import { sendContactMail } from '@/lib/mail';

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
    return result.error === 'spam'
      ? respond(request, true)
      : respond(request, false, result.error);
  }

  const headers = request.headers;

  // Stored first, delivered second. If the relay is down the submission is
  // still in the inbox - send.php simply lost it.
  const stored = getDb()
    .insert(messages)
    .values({
      name: result.value.name,
      email: result.value.email,
      body: result.value.body,
      ip: headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: headers.get('user-agent'),
    })
    .returning({ id: messages.id })
    .get();

  try {
    await sendContactMail(result.value);
    getDb()
      .update(messages)
      .set({ deliveredAt: new Date() })
      .where(eq(messages.id, stored.id))
      .run();
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);

    getDb().update(messages).set({ deliveryError: reason }).where(eq(messages.id, stored.id)).run();
    console.error(`[contact] message ${stored.id} stored but not delivered: ${reason}`);

    // The visitor's message is safe, so this is still a success for them.
    return respond(request, true);
  }

  return respond(request, true);
}
