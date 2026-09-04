import { updateSettings } from '@/app/admin/actions';
import { getAllSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: 'site_title', label: 'Site title' },
  { key: 'tagline', label: 'Tagline', hint: 'One line under your name in the sidebar.' },
  { key: 'avatar', label: 'Avatar image', hint: 'Path under /images. Blank hides it.' },
  { key: 'birth_date', label: 'Date of birth', hint: 'YYYY-MM-DD. Drives the {{age}} token.' },
  { key: 'contact_email', label: 'Contact e-mail' },
  { key: 'social_facebook', label: 'Facebook URL' },
  { key: 'social_linkedin', label: 'LinkedIn URL' },
  { key: 'social_github', label: 'GitHub URL' },
];

export default function SettingsPage() {
  const current = getAllSettings();

  return (
    <main className="admin-main">
      <h1>Settings</h1>
      <section className="panel">
        <form action={updateSettings} className="stack">
          {FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <input name={field.key} defaultValue={current[field.key] ?? ''} />
              {field.hint ? <span className="hint">{field.hint}</span> : null}
            </label>
          ))}
          <button type="submit">Save settings</button>
        </form>
      </section>
    </main>
  );
}
