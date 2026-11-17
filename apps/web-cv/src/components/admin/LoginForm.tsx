'use client';

import { useActionState } from 'react';

import { login } from '@/app/admin/actions';

export const LoginForm = () => {
  const [error, formAction, pending] = useActionState(login, null);

  // suppressHydrationWarning: password managers (LastPass, Dashlane, ...) add
  // inline styles and data attributes to credential inputs before React
  // hydrates. That mismatch is theirs and harmless; it only silences these two
  // elements' own attributes, nothing below them.
  return (
    <form action={formAction} className="stack">
      <label>
        E-mail
        <input name="email" type="email" required autoComplete="username" suppressHydrationWarning />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          suppressHydrationWarning
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};
