'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

/**
 * Repeating groups post as parallel arrays. Adding a row is client state;
 * removing one is just blanking its key field, which the parser drops.
 *
 * With `reorderable`, each row gets up/down buttons. Rows keep a stable id -
 * their original index, which is also what `renderRow` reads its defaults
 * from - and moving one moves its DOM node, so the inputs keep whatever was
 * typed into them. The form posts fields in DOM order, so the saved order is
 * the order on screen.
 */
export const RepeatingRows = ({
  initialCount,
  renderRow,
  addLabel,
  className,
  reorderable = false,
}: {
  initialCount: number;
  renderRow: (index: number) => ReactNode;
  addLabel: string;
  className?: string;
  reorderable?: boolean;
}) => {
  const [ids, setIds] = useState(() => Array.from({ length: Math.max(initialCount, 0) }, (_, i) => i));
  const container = useRef<HTMLDivElement>(null);

  const add = () => setIds((current) => [...current, current.length === 0 ? 0 : Math.max(...current) + 1]);

  const move = (id: number, step: -1 | 1) => {
    setIds((current) => {
      const from = current.indexOf(id);
      const to = from + step;

      if (from < 0 || to < 0 || to >= current.length) {
        return current;
      }

      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];

      return next;
    });

    // Keep focus on the button that was pressed, so a row can be walked up or
    // down with repeated Enter/Space presses. At either end, fall back to the
    // other direction's button, which is still enabled.
    requestAnimationFrame(() => {
      const row = container.current?.querySelector(`[data-row-id="${id}"]`);
      const button =
        row?.querySelector<HTMLButtonElement>(`button[data-step="${step}"]:not(:disabled)`) ??
        row?.querySelector<HTMLButtonElement>('button[data-step]:not(:disabled)');

      button?.focus();
    });
  };

  return (
    <div ref={container} className={className ? `rows ${className}` : 'rows'}>
      {ids.map((id, position) => (
        <div key={id} className="row" data-row-id={id}>
          {renderRow(id)}
          {reorderable && ids.length > 1 ? (
            <div className="row-tools">
              <button
                type="button"
                className="icon-btn"
                data-step={-1}
                aria-label="Move up"
                title="Move up"
                disabled={position === 0}
                onClick={() => move(id, -1)}
              >
                <ChevronUp size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn"
                data-step={1}
                aria-label="Move down"
                title="Move down"
                disabled={position === ids.length - 1}
                onClick={() => move(id, 1)}
              >
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ))}
      <button type="button" className="linkish" onClick={add}>
        {addLabel}
      </button>
    </div>
  );
};
