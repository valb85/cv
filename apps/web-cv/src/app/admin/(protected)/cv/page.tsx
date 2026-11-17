import { resetCv, updateCv } from '@/app/admin/actions';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CvFields } from '@/components/admin/CvFields';
import { Panel } from '@/components/admin/Panel';
import { getCvDocument, hasSavedCv } from '@/lib/cv';

export const dynamic = 'force-dynamic';

export default function AdminCvPage() {
  const saved = hasSavedCv();

  return (
    <>
      <AdminHeader eyebrow="Content" title="CV" />

      {saved ? null : (
        <p className="notice">
          Not saved yet. This draft was filled in from the site&apos;s About, Resume and Projects pages,
          and the Download CV button prints it as it is. Add what the site leaves out, such as company
          names and a phone number, then save.
        </p>
      )}

      <AdminForm
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
