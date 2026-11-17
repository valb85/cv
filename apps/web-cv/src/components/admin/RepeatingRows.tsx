'use client';

import { useState, type ReactNode } from 'react';

/**
 * Repeating groups post as parallel arrays. Adding a row is client state;
 * removing one is just blanking its key field, which the parser drops.
 */
export const RepeatingRows = ({
  initialCount,
  renderRow,
  addLabel,
  className,
}: {
  initialCount: number;
  renderRow: (index: number) => ReactNode;
  addLabel: string;
  className?: string;
}) => {
  const [count, setCount] = useState(Math.max(initialCount, 0));

  return (
    <div className={className ? `rows ${className}` : 'rows'}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="row">
          {renderRow(index)}
        </div>
      ))}
      <button type="button" className="linkish" onClick={() => setCount((n) => n + 1)}>
        {addLabel}
      </button>
    </div>
  );
};
