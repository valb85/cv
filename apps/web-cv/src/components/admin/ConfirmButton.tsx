'use client';

import type { MouseEvent, ReactNode } from 'react';

/**
 * A submit button that asks first. Cancelling the dialog stops the form from
 * posting; without JavaScript it submits directly, like any button.
 */
export const ConfirmButton = ({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) => {
  const onClick = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };

  return (
    <button type="submit" className={className} onClick={onClick}>
      {children}
    </button>
  );
};
