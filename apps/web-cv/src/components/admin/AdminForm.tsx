'use client';

import { useActionState, type ReactNode } from 'react';

type SaveAction = (previous: string | null, data: FormData) => Promise<string | null>;

/**
 * Wraps a save form so the action's return value is shown as confirmation.
 * The fields are server-rendered and passed through as children, so only the
 * bar itself is client-side.
 */
export const AdminForm = ({
  action,
  className,
  submitLabel,
  extra,
  children,
}: {
  action: SaveAction;
  className?: string;
  submitLabel: string;
  extra?: ReactNode;
  children: ReactNode;
}) => {
  const [message, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="action-bar">
        <p className={message ? 'save-msg shown' : 'save-msg'} role="status" aria-live="polite">
          {message ?? ''}
        </p>
        {extra}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
