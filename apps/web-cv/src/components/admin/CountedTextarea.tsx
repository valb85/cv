'use client';

import { useState } from 'react';

/** Meta descriptions get truncated by search engines, so the limit is shown. */
export const CountedTextarea = ({
  name,
  defaultValue,
  limit,
  rows = 5,
}: {
  name: string;
  defaultValue: string;
  limit: number;
  rows?: number;
}) => {
  const [length, setLength] = useState(defaultValue.length);

  return (
    <div className="counted">
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        onChange={(event) => setLength(event.target.value.length)}
      />
      <span className={length > limit ? 'counter over' : 'counter'}>
        {length} / {limit}
      </span>
    </div>
  );
};
