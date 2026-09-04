export type ContactInput = {
  name: string;
  email: string;
  body: string;
};

export type ValidationResult = { ok: true; value: ContactInput } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = { name: 120, email: 200, body: 5000 } as const;

export const validateContact = (raw: {
  name: string;
  email: string;
  message: string;
  website?: string;
}): ValidationResult => {
  // Honeypot: a hidden field only an automated submitter fills in. Accepted
  // silently by the caller so the bot sees success and does not retry.
  if (raw.website && raw.website.length > 0) {
    return { ok: false, error: 'spam' };
  }

  const name = raw.name.trim();
  const email = raw.email.trim();
  const body = raw.message.trim();

  if (!name || !email || !body) {
    return { ok: false, error: 'Name, e-mail and message are all required.' };
  }

  if (name.length > LIMITS.name || email.length > LIMITS.email || body.length > LIMITS.body) {
    return { ok: false, error: 'One of the fields is too long.' };
  }

  if (!EMAIL.test(email)) {
    return { ok: false, error: 'That e-mail address does not look right.' };
  }

  return { ok: true, value: { name, email, body } };
};
