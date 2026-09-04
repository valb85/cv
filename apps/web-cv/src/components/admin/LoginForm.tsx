'use client';

import { useActionState } from 'react';

import { login } from '@/app/admin/actions';

export const LoginForm = () => {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="stack">
      <label>
        E-mail
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
};
