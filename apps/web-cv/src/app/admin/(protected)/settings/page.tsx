import { changePassword, updateContactSettings, updateSettings } from '@/app/admin/actions';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Panel } from '@/components/admin/Panel';
import { SettingsTabs, type SettingsTab } from '@/components/admin/SettingsTabs';
import { adminPath } from '@/lib/admin-path';
import { turnstileSiteKey } from '@/lib/contact-guard';
import { CONTACT_SETTING_FIELDS, getContactSettings } from '@/lib/contact-settings';
import { getAllSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

type Field = {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'email' | 'url' | 'date';
  placeholder?: string;
};

const PROFILE_FIELDS: Field[] = [
  { key: 'site_title', label: 'Site title', hint: 'Your name, as shown in the sidebar and the browser tab.' },
  { key: 'role', label: 'Role', hint: 'Shown under your name in the sidebar.' },
  { key: 'avatar', label: 'Avatar image', hint: 'Path under /images. Blank hides it.', placeholder: '/images/me.jpg' },
  { key: 'birth_date', label: 'Date of birth', type: 'date', hint: 'Drives the {{age}} token on the pages.' },
];

const LINK_FIELDS: Field[] = [
  { key: 'contact_email', label: 'Contact e-mail', type: 'email' },
  { key: 'social_linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://www.linkedin.com/in/...' },
  { key: 'social_github', label: 'GitHub URL', type: 'url', placeholder: 'https://github.com/...' },
  { key: 'social_twitter', label: 'Twitter URL', type: 'url', placeholder: 'https://x.com/...' },
  { key: 'social_instagram', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/...' },
  { key: 'social_facebook', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/...' },
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'links', label: 'Links', icon: 'link' },
  { id: 'contact', label: 'Contact form', icon: 'mail' },
  { id: 'security', label: 'Security', icon: 'shield' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const isTab = (value: string | undefined): value is TabId => TABS.some((tab) => tab.id === value);

type Props = { searchParams: Promise<{ tab?: string }> };

/** Text fields that save through updateSettings, which stores whatever it receives. */
const SettingFields = ({ fields, values }: { fields: Field[]; values: Record<string, string> }) => (
  <div className="pair cv-pair">
    {fields.map((field) => (
      <label key={field.key}>
        {field.label}
        <input
          name={field.key}
          type={field.type ?? 'text'}
          placeholder={field.placeholder}
          defaultValue={values[field.key] ?? ''}
        />
        {field.hint ? <span className="hint">{field.hint}</span> : null}
      </label>
    ))}
  </div>
);

/**
 * One tab, one form, one save button: each tab saves only its own fields, so
 * it is always clear what a button saves. Blank fields are kept as blank.
 */
export default async function SettingsPage({ searchParams }: Props) {
  const requested = (await searchParams).tab;
  const tab: TabId = isTab(requested) ? requested : 'profile';
  const current = getAllSettings();

  const tabs: SettingsTab[] = TABS.map((entry) => ({
    ...entry,
    href: adminPath(`/settings?tab=${entry.id}`),
  }));

  return (
    <>
      <AdminHeader eyebrow="Configuration" title="Settings" />
      <SettingsTabs tabs={tabs} current={tab} />

      {/* key: switching tabs remounts the form, so its save message and
          field state never carry over from another tab. */}
      <div className="settings-body" key={tab}>
        {tab === 'profile' ? (
          <AdminForm action={updateSettings} className="editor-grid" submitLabel="Save profile">
            <Panel icon="user" title="Profile" wide>
              <SettingFields fields={PROFILE_FIELDS} values={current} />
            </Panel>
          </AdminForm>
        ) : null}

        {tab === 'links' ? (
          <AdminForm action={updateSettings} className="editor-grid" submitLabel="Save links">
            <Panel icon="link" title="Links" wide>
              <p className="hint tab-intro">
                Shown in the site&apos;s sidebar. Leave a field empty to hide that link. The PDF CV has
                its own contact details under CV.
              </p>
              <SettingFields fields={LINK_FIELDS} values={current} />
            </Panel>
          </AdminForm>
        ) : null}

        {tab === 'contact' ? <ContactTab values={current} /> : null}

        {tab === 'security' ? (
          <AdminForm action={changePassword} className="editor-grid" submitLabel="Change password">
            <Panel icon="shield" title="Password" wide>
              <div className="pair cv-pair">
                <label>
                  Current password
                  <input name="current_password" type="password" required autoComplete="current-password" />
                </label>
                <span aria-hidden="true" />
                <label>
                  New password
                  <input name="new_password" type="password" required minLength={12} autoComplete="new-password" />
                  <span className="hint">At least 12 characters.</span>
                </label>
                <label>
                  Repeat new password
                  <input name="confirm_password" type="password" required minLength={12} autoComplete="new-password" />
                </label>
              </div>
            </Panel>
          </AdminForm>
        ) : null}
      </div>
    </>
  );
}

const ContactTab = ({ values }: { values: Record<string, string> }) => {
  const contact = getContactSettings(values);
  const turnstileOn = turnstileSiteKey() !== null;

  return (
    <AdminForm action={updateContactSettings} className="editor-grid" submitLabel="Save contact limits">
      <Panel icon="mail" title="Spam limits" wide>
        <p className="hint tab-intro">
          Per sender IP. Changes apply to the next message, no restart needed. Messages in the inbox
          count towards the limits, so Delete all in Messages also resets them.
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
      </Panel>

      <Panel icon="shield" title="Human check" wide>
        <p className="status-line">
          <span className={turnstileOn ? 'tag live' : 'tag'}>{turnstileOn ? 'on' : 'off'}</span>
          <span className="hint">
            {turnstileOn
              ? 'Cloudflare Turnstile verifies each message before it is stored.'
              : 'Cloudflare Turnstile is not configured, so only the limits above apply.'}{' '}
            It is switched on with TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY on the server.
          </span>
        </p>
      </Panel>
    </AdminForm>
  );
};
