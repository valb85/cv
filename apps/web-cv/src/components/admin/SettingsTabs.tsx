'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';

import { Icon } from '@/components/Icon';

export type SettingsTab = { id: string; label: string; icon: string; href: string };

/** True when any field in the settings form differs from what was loaded. */
const hasUnsavedChanges = (): boolean =>
  Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    '.settings-body input:not([type=hidden]), .settings-body textarea',
  )).some((field) => field.value !== field.defaultValue);

/**
 * The tab bar on the Settings page. Each tab is a plain link (?tab=...), so a
 * tab has its own URL, survives a reload and works without JavaScript. With
 * JavaScript, leaving a tab with unsaved edits asks first - switching tabs is
 * a navigation, and the edits would otherwise be lost silently.
 */
export const SettingsTabs = ({ tabs, current }: { tabs: SettingsTab[]; current: string }) => {
  const onClick = (event: MouseEvent<HTMLAnchorElement>, id: string): void => {
    if (id !== current && hasUnsavedChanges() && !window.confirm('You have unsaved changes on this tab. Leave without saving?')) {
      event.preventDefault();
    }
  };

  return (
    <nav className="tabs" aria-label="Settings sections">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className="tab"
          aria-current={tab.id === current ? 'page' : undefined}
          onClick={(event) => onClick(event, tab.id)}
          scroll={false}
        >
          <Icon name={tab.icon} size={17} />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
};
