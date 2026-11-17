import { getCvPdf } from '@/lib/cv-pdf';
import { getAllSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** "Victor Albulescu" -> "Victor-Albulescu-CV.pdf", safe for a header value. */
const fileName = (name: string): string =>
  `${name.normalize('NFKD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'CV'}-CV.pdf`;

export const GET = async (): Promise<Response> => {
  try {
    const pdf = await getCvPdf();

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName(getAllSettings().site_title ?? '')}"`,
        'Content-Length': String(pdf.length),
        // The content behind it changes with every admin save.
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[cv.pdf] render failed', error);

    // A plain-text 503 rather than the HTML error page: the button carries
    // `download`, and an HTML body would be saved as the "CV" again.
    return new Response('The CV could not be generated right now. Please try again later.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' },
    });
  }
};
