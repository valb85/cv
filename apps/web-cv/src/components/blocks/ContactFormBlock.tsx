'use client';

import { useState, type FormEvent } from 'react';

import type { BlockDataMap } from '@/lib/blocks';
import { LIMITS } from '@/lib/contact';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export const ContactFormBlock = ({
  data,
  initialStatus = 'idle',
}: {
  data: BlockDataMap['contact_form'];
  // Set from ?contact=sent so the no-JS redirect still confirms.
  initialStatus?: Status;
}) => {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState<string | null>(null);

  // Enhances the plain form; without JS it posts normally and the endpoint
  // redirects back with ?contact=sent.
  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus('sending');
    setError(null);

    const form = event.currentTarget;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: new FormData(form),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (payload.ok) {
        form.reset();
        setStatus('sent');
        return;
      }

      setError(payload.error ?? 'Something went wrong.');
      setStatus('error');
    } catch {
      setError('Could not reach the server.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <section className="block contact">
        <p className="msg-success">Your message has been sent. Thank you!</p>
      </section>
    );
  }

  return (
    <section className="block contact">
      {data.intro ? <p>{data.intro}</p> : null}
      <form className="contact-form" method="post" action="/api/contact" onSubmit={onSubmit}>
        <label>
          Name
          <input name="name" type="text" required maxLength={LIMITS.name} autoComplete="name" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required maxLength={LIMITS.email} autoComplete="email" />
        </label>
        <label>
          Message
          <textarea name="message" required rows={6} maxLength={LIMITS.body} />
        </label>
        {/* Honeypot: hidden from people, filled in by bots. */}
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="honeypot"
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </section>
  );
};
