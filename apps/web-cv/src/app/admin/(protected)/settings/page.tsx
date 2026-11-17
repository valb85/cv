import { changePassword, updateContactSettings, updateSettings } from '@/app/admin/actions';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Panel } from '@/components/admin/Panel';
import { turnstileSiteKey } from '@/lib/contact-guard';
import { CONTACT_SETTING_FIELDS, getContactSettings } from '@/lib/contact-settings';
import { getAllSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

type Field = { key: string; label: string; hint?: string };

const GROUPS: { icon: string; title: string; fields: Field[] }[] = [
  {
    icon: 'user',
    title: 'Identity',
    fields: [
      { key: 'site_title', label: 'Site title' },
      { key: 'role', label: 'Role', hint: 'Shown under your name in the sidebar.' },
      { key: 'avatar', label: 'Avatar image', hint: 'Path under /images. Blank hides it.' },
      { key: 'birth_date', label: 'Date of birth', hint: 'YYYY-MM-DD. Drives the {{age}} token.' },
    ],
  },
  {
    icon: 'link',
    title: 'Links',
    fields: [
      { key: 'contact_email', label: 'Contact e-mail' },
      { key: 'social_github', label: 'GitHub URL' },
      { key: 'social_linkedin', label: 'LinkedIn URL' },
      { key: 'social_twitter', label: 'Twitter URL' },
      { key: 'social_instagram', label: 'Instagram URL' },
      { key: 'social_facebook', label: 'Facebook URL' },
    ],
  },
];

export default function SettingsPage() {
  const current = getAllSettings();
  const contact = getContactSettings(current);

  return (
    <>
      <AdminHeader eyebrow="Configuration" title="Settings" />

      <AdminForm action={updateSettings} className="editor-grid" submitLabel="Save settings">
        {GROUPS.map((group) => (
          <Panel key={group.title} icon={group.icon} title={group.title}>
            {group.fields.map((field) => (
              <label key={field.key}>
                {field.label}
                <input name={field.key} defaultValue={current[field.key] ?? ''} />
                {field.hint ? <span className="hint">{field.hint}</span> : null}
              </label>
            ))}
          </Panel>
        ))}

      </AdminForm>

      <AdminForm action={updateContactSettings} className="editor-grid" submitLabel="Save contact limits">
        <Panel icon="mail" title="Contact form" wide>
          <p className="hint contact-limits-intro">
            Limits for the contact form, per sender IP. They apply to the next message, no restart
            needed. Messages already in the inbox count towards the limits, so Delete all in Messages
            also resets them.
          </p>
          <div className="pair cv-pair">
            {CONTACT_SETTING_FIELDS.map((field) => {
              const value = contact[field.prop];

              return (
                <label key={field.key}>
                  {field.label}
                  <input
                    name={field.key}
                    type="number"
                    inputMode="numeric"
                    min={field.min}
                    max={field.max}
                    step={1}
                    required={!field.optional}
                    defaultValue={value === null ? '' : value}
                  />
                  <span className="hint">{field.hint}</span>
                </label>
              );
            })}
          </div>
          <p className="hint">
            Human check (Cloudflare Turnstile):{' '}
            <strong>{turnstileSiteKey() ? 'on' : 'off'}</strong>. It is switched on with
            TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY on the server, not here.
          </p>
        </Panel>
      </AdminForm>

      <AdminForm action={changePassword} className="editor-grid" submitLabel="Change password">
        <Panel icon="user" title="Password">
          <label>
            Current password
            <input name="current_password" type="password" required autoComplete="current-password" />
          </label>
          <label>
            New password
            <input name="new_password" type="password" required autoComplete="new-password" />
            <span className="hint">At least 12 characters.</span>
          </label>
          <label>
            Repeat new password
            <input name="confirm_password" type="password" required autoComplete="new-password" />
          </label>
        </Panel>
      </AdminForm>
    </>
  );
}
