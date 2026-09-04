'use client';

import { useState, type FormEvent } from 'react';

import type { BlockDataMap } from '@/lib/blocks';
import { LIMITS } from '@/lib/contact';
import { Icon } from '@/components/Icon';

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
      <section className="block contact card">
        <p className="msg-success">Your message has been sent. Thank you!</p>
      </section>
    );
  }

  return (
    <section className="block contact card">
      {data.title ? <h3 className="contact-title">{data.title}</h3> : null}
      {data.intro ? <p className="contact-intro">{data.intro}</p> : null}
      <form className="contact-form" method="post" action="/api/contact" onSubmit={onSubmit}>
        <label className="field">
          <Icon name="user" size={17} />
          <input name="name" type="text" required placeholder="Name" maxLength={LIMITS.name} autoComplete="name" />
        </label>
        <label className="field">
          <Icon name="mail" size={17} />
          <input name="email" type="email" required placeholder="E-mail" maxLength={LIMITS.email} autoComplete="email" />
        </label>
        {data.subjects.length > 0 ? (
          <label className="field">
            <Icon name="briefcase" size={17} />
            <select name="subject" defaultValue="">
              <option value="" disabled>
                Subject / Project Type
              </option>
              {data.subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field textarea">
          <Icon name="mail" size={17} />
          <textarea name="message" required rows={7} placeholder="Your message..." maxLength={LIMITS.body} />
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
        <button type="submit" className="btn btn-primary send" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </button>
        {data.footnote ? <p className="footnote">{data.footnote}</p> : null}
      </form>
    </section>
  );
};
