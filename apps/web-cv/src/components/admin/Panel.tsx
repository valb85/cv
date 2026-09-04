import type { ReactNode } from 'react';

import { Icon } from '@/components/Icon';

export const Panel = ({
  icon,
  title,
  action,
  children,
}: {
  icon: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="panel">
    <div className="panel-head">
      <span className="panel-icon">
        <Icon name={icon} size={20} />
      </span>
      <h2>{title}</h2>
      {action ? <div className="panel-action">{action}</div> : null}
    </div>
    {children}
  </section>
);
