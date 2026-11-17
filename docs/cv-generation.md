# CV download

The **Download CV** button on `/developer` links to `/cv.pdf`. The PDF is
generated from the CV edited under **Admin → CV**, so the next download always
shows the latest save. No PDF is kept by hand in the repo or in `/uploads`.

## How it works

```
Admin → CV  (src/app/admin/(protected)/cv/page.tsx, CvFields.tsx)
  └─ updateCv / resetCv  (src/app/admin/actions.ts)
       └─ cv_document table, one row (id 1), the whole CV as JSON

/cv.pdf  (src/app/cv.pdf/route.ts)
  └─ getCvPdf()  (src/lib/cv-pdf.ts)
       ├─ cached?  → serve from memory
       └─ headless Chromium → http://<own host>:3000/cv-print → page.pdf(A4)
            └─ /cv-print  (src/app/cv-print/page.tsx + cv-print.css)
                 └─ getCvDocument()  (src/lib/cv.ts)
```

### The CV document

`CvDocument` (`src/lib/cv-document.ts`) is the CV as structured data, kept
apart from the site's page blocks because a CV needs things the marketing
pages don't have, such as company names, a phone number and bullet points:

- personal details: name, headline, e-mail, phone, location, website,
  LinkedIn, GitHub;
- summary (blank line = new paragraph) and interests;
- experience: role, company, location, period, description, tech;
- education: degree, school, period, description;
- skill groups, languages, projects.

Descriptions are free text, and lines starting with `- ` print as bullet
points. Empty fields and sections are left off the PDF. Every list prints in
the order shown in the editor; the up/down arrows on each row reorder it
(`RepeatingRows` with `reorderable`), and the new order is saved on the next
**Save CV**.

**Before the first save** there is no row, and `importCvFromSite()` builds a
draft from the site: identity from settings, the summary from About's hero,
experience and education from Resume's timelines, skills from Resume's pill
groups, languages and interests from About, and projects from Projects. The
editor opens with that draft and the PDF prints it, so the button works on a
fresh install. **Re-import from site** in the editor deletes the saved row to
go back to the imported draft.

### Source: `/cv-print`

A layout of its own, not the site's blocks: a header with name, headline and
contacts, then Profile, Experience, Skills, Projects, Education, and Languages
next to Interests, in one A4 column with the dates in a narrow left column.
The palette is light on screen too, so the browser preview matches the PDF.

The page is the design tool: open `/cv-print` (or **Preview** in the editor)
and use print preview. It is `noindex` and not linked from the site.

### Rendering: headless Chromium

`puppeteer-core` launches the browser at `CHROMIUM_PATH` and loads
`/cv-print` from this Node process directly, not through Apache, so there is
no TLS or vhost in the way. The address follows `HOSTNAME`, which is the
address the standalone server binds to: `127.0.0.1` under systemd, the
container ID inside Docker.

While it renders:

- requests off that origin are aborted. The blocks hold admin-authored HTML,
  and the server should not fetch arbitrary URLs because of it;
- `/uploads/*` is answered from `UPLOAD_DIR`, because Apache normally serves
  it and this render bypasses Apache;
- Chromium runs with `--no-sandbox`. Neither the container nor the hardened
  systemd unit gives it the namespaces its sandbox needs, and it only ever
  loads our own page.

A render takes about 1.5 s.

### Caching

The PDF is kept in memory together with a version: a hash of the CV document
and the build ID, so a save in the admin and a deploy that changes the layout
both re-render it. Until the first save the document is the import, so site
edits change it too.

- The same version is served from memory, in about 10 ms.
- Concurrent requests for a new version share one render.
- A failed render is not cached, so the next request tries again, and the
  request gets a plain-text 503 rather than an HTML page that the browser
  would save as the "CV".
- `next dev` skips the cache, so CSS edits show up on the next download.

### The button

`HeroBlock` only adds `download` when the href is a real target, so a `#`
placeholder never saves the page. Migration `0004_cv_download_link` points an
existing "Download CV" hero button that is still on `#`, empty, or `/cv.pdf`
at `/cv.pdf`. A link set to anything else in the admin is left alone.

## Install / deploy

- **Docker:** `Dockerfile.base` installs `chromium`, `fonts-dejavu-core` and
  `fonts-liberation` (the slim image has no fonts at all) and sets
  `CHROMIUM_PATH=/usr/bin/chromium`. This adds roughly 300 MB to the image.
- **Non-Docker production** (`deploy/`): install Google Chrome from its `.deb`
  and set `CHROMIUM_PATH=/usr/bin/google-chrome` in `/etc/cv.env`. See
  `deploy/DEPLOY.md` step 1. Ubuntu's `chromium-browser` is a snap and does not
  run under the hardened unit. Chromium's profile goes to the service's
  private `/tmp`, because its home directory is read-only.
- Without `CHROMIUM_PATH`, the rest of the site works and `/cv.pdf` answers
  503.

## Possible next steps

- A per-language CV would need one document per language.
