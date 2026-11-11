# CV download — generation plan

**Status:** not built. The **Download CV** button on the home page links to
`#` and does nothing.

## Why it is a placeholder

The hero's secondary button pointed at `/cv.pdf`, a file that was never
produced. The request fell through to the site's 404 page, and because the
link carried a `download` attribute the browser saved that HTML page as the
"CV".

For now:

- the hero block's `secondaryHref` is `#` (home page, editable in the admin
  under the hero block);
- `HeroBlock` only adds `download` when the href is a real target — a `#` or
  empty href renders a plain link, so a placeholder can never save the page.

**Production still holds `/cv.pdf`** in its database. Change it to `#` in the
admin (Pages → Home → hero block → secondary link) until this is built.

## Goal

A PDF CV that is generated from the same content as the site, so it can never
drift from it: edit a timeline entry in the admin, and the next download
already reflects it. No hand-maintained PDF in the repo or in `/uploads`.

## Proposed design

### 1. Source: a print route

Add `/cv/print`: a page that renders the CV-relevant content — identity from
`settings`, then the `about`, `resume` and `projects` pages' blocks — through
the existing block renderers, without the sidebar, in a single A4 column.

`globals.css` already has an `@media print` section (white background, sidebar
and contact form hidden, cards not split across pages). The print route builds
on that rather than on a second stylesheet. It is also how the PDF gets
designed and checked: open `/cv/print` and use the browser's print preview.

### 2. Rendering: headless Chromium

Add a route handler at `src/app/cv.pdf/route.ts` that loads `/cv/print` in
headless Chromium (`puppeteer-core`) and calls `page.pdf({ format: 'A4',
printBackground: true })`.

Chromium is chosen over a PDF library because it renders the real site: the
same components, fonts and tokens, so there is one layout to maintain.

| | Chromium (`puppeteer-core`) | `@react-pdf/renderer` |
|---|---|---|
| Layout | reuses the site's components and CSS | a second, parallel layout in PDF primitives |
| Image size | +~300 MB (`chromium` apt package) | +~10 MB |
| Memory per render | ~150 MB, for a few seconds | small |
| Fidelity to the site | exact | approximate |

Given one author and an occasional download, the cost of Chromium is paid
rarely, and avoiding a second layout is worth more.

### 3. Caching

Generating on every click is wasteful. Cache the PDF in the data volume:

- path: `${DATABASE_PATH%/*}/cv-<version>.pdf`;
- `<version>` = the newest `updated_at` across `pages`, `blocks` and
  `settings` — any admin save produces a new version;
- on request: serve the cached file if it exists for the current version,
  otherwise render, write, delete older versions, then serve;
- headers: `Content-Type: application/pdf`,
  `Content-Disposition: attachment; filename="Victor-Albulescu-CV.pdf"`.

Concurrent first requests for a new version should share one render (an
in-process promise keyed by version), not start several browsers.

### 4. Wiring

- Set the hero's `secondaryHref` back to `/cv.pdf` (seed and admin). The
  `download` attribute returns automatically for a real href.
- `proxy.ts` already lets `/cv.pdf` through to Next; Apache proxies everything
  that is not `/uploads` or an error page, so no proxy change is needed.

## Install / deploy impact

- **Docker:** add `chromium` (and `fonts-dejavu-core` or the site's font
  packages) to `apps/web-cv/Dockerfile.base`; point `puppeteer-core` at
  `/usr/bin/chromium` via a `CHROMIUM_PATH` env var.
- **Non-Docker production** (`deploy/`): the server needs the `chromium`
  package too; add it to `deploy/DEPLOY.md` and set `CHROMIUM_PATH` in
  `/etc/cv.env`.
- Chromium inside a container needs `--no-sandbox` unless the container is
  given a seccomp profile; it only ever loads our own `/cv/print`, never a
  user-supplied URL.

## Open questions

- Which pages go into the CV — all of `about`, `resume`, `projects`, or a
  curated subset? A per-page "include in CV" toggle in the admin would make it
  editable instead of hard-coded.
- Should the contact details in the PDF include the e-mail address in clear
  text (fine for a CV you hand out) even though the site could obscure it?
- One language, or a per-language CV later?
