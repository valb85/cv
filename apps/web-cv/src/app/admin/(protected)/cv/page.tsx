import { importCv, resetCv, updateCv } from '@/app/admin/actions';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CvFields } from '@/components/admin/CvFields';
import { Panel } from '@/components/admin/Panel';
import { adminPath } from '@/lib/admin-path';
import { getCvDocument, hasSavedCv } from '@/lib/cv';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ imported?: string }> };

export default async function AdminCvPage({ searchParams }: Props) {
  const { imported } = await searchParams;
  const saved = hasSavedCv();

  return (
    <>
      <AdminHeader eyebrow="Content" title="CV" />

      {imported ? (
        <p className="notice">CV imported from file and saved. The next download uses it.</p>
      ) : saved ? null : (
        <p className="notice">
          Not saved yet. This draft was filled in from the site&apos;s About, Resume and Projects pages,
          and the Download CV button prints it as it is. Add what the site leaves out, such as company
          names and a phone number, then save.
        </p>
      )}

      <AdminForm
        // A new key after an import remounts the fields: they are uncontrolled,
        // so a re-render alone would keep showing the pre-import values.
        key={imported ?? 'editor'}
        action={updateCv}
        className="editor-grid"
        submitLabel="Save CV"
        extra={
          <>
            <a className="btn btn-ghost" href="/cv-print" target="_blank" rel="noopener">
              Preview
            </a>
            <a className="btn btn-ghost" href="/cv.pdf" download>
              Download PDF
            </a>
          </>
        }
      >
        <CvFields cv={getCvDocument()} />
      </AdminForm>

      <Panel icon="file" title="Export / import">
        <p className="hint">
          Move the CV between environments - for example, edit it locally and import it on the live
          site - or keep a copy. Export saves the CV as shown above (the last saved version) as a
          .json file.
        </p>
        <p className="row-form export-row">
          <a className="btn btn-ghost" href={adminPath('/cv/export')} download>
            Export JSON
          </a>
        </p>
        <AdminForm action={importCv} className="import-form" submitLabel="Import JSON">
          <label>
            CV export file
            <input name="file" type="file" accept="application/json,.json" required />
            <span className="hint">Replaces the saved CV. Export first if you want to keep it.</span>
          </label>
        </AdminForm>
      </Panel>

      {saved ? (
        <Panel icon="sparkles" title="Start over">
          <form action={resetCv} className="row-form">
            <p className="hint">
              Discards the saved CV and imports a fresh draft from the site&apos;s pages. This cannot be
              undone.
            </p>
            <button type="submit" className="btn btn-ghost">
              Re-import from site
            </button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}
