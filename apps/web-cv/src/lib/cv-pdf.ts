import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import puppeteer, { type HTTPRequest } from 'puppeteer-core';

import { cvVersion } from '@/lib/cv';

/**
 * Turns /cv-print into a PDF with headless Chromium, so the PDF is the site's
 * own components and CSS rather than a second layout to keep in step.
 *
 * One PDF is kept in memory per CV version: rendering costs a browser launch
 * and a few seconds, and the content changes only when the admin saves.
 */

/** Changes on every deploy, so new CSS or components re-render the PDF. */
const BUILD_ID = (() => {
  try {
    return readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim();
  } catch {
    // Only reached without a build (`next dev`), where nothing is cached.
    return 'development';
  }
})();

const RENDER_TIMEOUT_MS = 30_000;

const MIME: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/**
 * Chromium loads the page from this Node process directly, not through
 * Apache, so there is no TLS or vhost in the way. The standalone server binds
 * to HOSTNAME - 127.0.0.1 under systemd, but the container ID inside Docker,
 * which sets HOSTNAME itself - so the render goes wherever the server listens.
 */
const internalOrigin = (): string => {
  const host = process.env.HOSTNAME;
  // `next dev` listens on every interface but only serves /_next assets to
  // origins it trusts, so in development the render always uses loopback.
  const target =
    process.env.NODE_ENV !== 'production' || !host || host === '0.0.0.0' || host === '::'
      ? '127.0.0.1'
      : host;

  return `http://${target.includes(':') ? `[${target}]` : target}:${process.env.PORT ?? '3000'}`;
};

const chromiumPath = (): string => {
  const executable = process.env.CHROMIUM_PATH;

  if (!executable) {
    throw new Error('CHROMIUM_PATH is not set - see docs/cv-generation.md');
  }

  return executable;
};

/**
 * /uploads is served by Apache, which this render bypasses, so those files
 * are answered from UPLOAD_DIR here. Every other request must stay on our own
 * origin: the content is admin-authored HTML, and the server should not be
 * made to fetch arbitrary URLs on its behalf.
 */
const handleRequest = async (request: HTTPRequest, origin: string): Promise<void> => {
  const url = new URL(request.url());

  if (url.protocol === 'data:') {
    return request.continue();
  }

  if (url.origin !== origin) {
    return request.abort('blockedbyclient');
  }

  const uploadDir = process.env.UPLOAD_DIR;

  if (uploadDir && url.pathname.startsWith('/uploads/')) {
    const root = path.resolve(uploadDir);
    const file = path.resolve(root, decodeURIComponent(url.pathname.slice('/uploads/'.length)));

    if (!file.startsWith(`${root}${path.sep}`)) {
      return request.abort('accessdenied');
    }

    try {
      return await request.respond({
        status: 200,
        contentType: MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        body: await readFile(file),
      });
    } catch {
      return request.respond({ status: 404, body: '' });
    }
  }

  return request.continue();
};

const render = async (): Promise<Buffer> => {
  const origin = internalOrigin();
  const browser = await puppeteer.launch({
    executablePath: chromiumPath(),
    headless: true,
    // The container and the systemd unit both lack the namespaces Chromium's
    // sandbox needs. It only ever loads our own /cv-print, and every request
    // off that origin is aborted above.
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
    timeout: RENDER_TIMEOUT_MS,
    // Under systemd the service's home (/srv/cv) is read-only; Chromium's
    // profile and caches go to the private /tmp instead.
    env: { ...process.env, HOME: tmpdir(), XDG_CONFIG_HOME: tmpdir(), XDG_CACHE_HOME: tmpdir() },
  });

  try {
    const page = await browser.newPage();

    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      handleRequest(request, origin).catch(() => undefined);
    });

    const response = await page.goto(`${origin}/cv-print`, { waitUntil: 'networkidle0' });

    if (!response?.ok()) {
      throw new Error(`/cv-print answered ${response?.status() ?? 'nothing'}`);
    }

    await page.evaluate(() => document.fonts.ready);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

type Cached = { version: string; pdf: Promise<Buffer> };

const globalForCv = globalThis as unknown as { __cvPdf?: Cached };

/**
 * The PDF for the current content. Concurrent requests for a version that is
 * still rendering share that one render instead of each launching a browser;
 * a failed render is forgotten so the next request tries again.
 */
export const getCvPdf = (): Promise<Buffer> => {
  // In development the CSS changes under a fixed BUILD_ID; render every time.
  if (process.env.NODE_ENV !== 'production') {
    return render();
  }

  const version = cvVersion(BUILD_ID);
  const cached = globalForCv.__cvPdf;

  if (cached?.version === version) {
    return cached.pdf;
  }

  const pdf = render();
  const entry: Cached = { version, pdf };

  globalForCv.__cvPdf = entry;
  pdf.catch(() => {
    if (globalForCv.__cvPdf === entry) {
      globalForCv.__cvPdf = undefined;
    }
  });

  return pdf;
};
