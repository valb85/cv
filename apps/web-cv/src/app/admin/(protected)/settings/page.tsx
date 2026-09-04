import { updateSettings } from '@/app/admin/actions';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Panel } from '@/components/admin/Panel';
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
      { key: 'footer_note', label: 'Footer note' },
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

  return (
    <>
      <AdminHeader eyebrow="Configuration" title="Settings" />

      <form action={updateSettings} className="editor-grid">
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

        <div className="action-bar">
          <button type="submit" className="btn btn-primary">
            Save settings
          </button>
        </div>
      </form>
    </>
  );
}
