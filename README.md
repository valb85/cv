# cv

Personal CV site for Victor Albulescu. Content lives in SQLite and is edited
through a built-in admin area — pages, menu entries, blocks, settings and
contact submissions are all editable without touching code.

Next.js 16 · React 19 · SQLite via Drizzle · Apache reverse proxy · Docker

> Replaces a 2018 jQuery template that shipped 348K of JavaScript and hard-coded
> every word of the CV in `index.html`. To read it: `git show 9a759e5:legacy/index.html`.

## Running it

`dco` is an alias for `docker compose`.

```bash
cp .env.dev .env
dco up -d --build      # first run, or after changing a Dockerfile
dco start / dco stop   # afterwards
dco logs -f cv
```

| | URL |
|---|---|
| Site | https://cv.localhost (or http://localhost:12100) |
| Admin | https://cv.localhost/admin |

Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`; the account is
created on first boot and never overwritten afterwards.

`dco start` only starts containers that already exist. After `dco down`, use
`dco up -d`. Environment changes need `dco up -d <service>` — a restart keeps
the old environment.

The browser will warn about the certificate on first visit: Caddy issues it
from its own local CA. Either click through, or trust the CA:

```bash
dco cp caddy:/data/caddy/pki/authorities/local/root.crt /tmp/cv-root.crt
sudo cp /tmp/cv-root.crt /usr/local/share/ca-certificates/cv-local.crt
sudo update-ca-certificates
```

## Services

| Service | Purpose | Published |
|---|---|---|
| `caddy` | TLS for cv.localhost, proxies to apache | 443 |
| `apache` | Serves `/uploads` and error pages, proxies the rest to Next | 12100 |
| `cv` | The Next.js app | — |
| `cv-base` | Build-only: tags the base image `cv`'s Dockerfile builds `FROM` | — |

## Layout

```
apps/web-cv/          Next.js app
  src/app/            routes: /, /[slug], /admin/*, /api/*
  src/db/             schema, client, migrations, seed
  src/lib/            auth, blocks, contact, sanitize, tokens
  drizzle/            generated migration SQL
apps/web-apache/      reverse proxy container
deploy/               host Apache vhost for production
Caddyfile             local HTTPS
```

## Contact form

Submissions are stored in the `messages` table and read in the admin inbox at
`/admin/messages`, where they can be marked read or deleted. **Nothing is sent
by e-mail** — there is no SMTP configuration and no relay to keep working, so
the only place a message can go missing is if it is deleted on purpose.

Check the inbox; nothing will notify you.

## Content model

A page *is* a menu entry — `in_menu` and `nav_order` are the whole navigation
model, so adding a page and adding its link are one action.

Pages hold ordered **blocks**, each with a type and a typed JSON payload:
`heading`, `rich_text`, `skill_list`, `timeline`, `fact_list`, `image`,
`contact_form`. Adding a type means one renderer and one editor form.

`rich_text` and `fact_list` values support a `{{age}}` token, resolved per
request from the `birth_date` setting — so the age is never stale and the date
stays editable.

`rich_text` is sanitised **on write** against an allow-list, so the database
never holds a script payload.

### Seeding

```bash
dco exec cv pnpm run db:seed          # refuses if pages already exist
dco exec cv pnpm run db:seed --force  # replaces them
```

## Deploying

Target: Ubuntu 22.04 with Apache and Docker. The host Apache terminates TLS and
proxies to the container, which publishes on loopback only.

```bash
git clone <repo> /srv/cv && cd /srv/cv
cp .env.prod .env
```

Edit `.env` — set `APP_DOMAIN`, and fill in the blanks:

```bash
openssl rand -hex 32        # SESSION_SECRET
```

and `ADMIN_PASSWORD`.

```bash
dco up -d --build
```

This builds on the server — there is no registry. `./data/db` and
`./data/uploads` are created as bind mounts and hold everything that matters.

Then the vhost:

```bash
sudo cp deploy/apache-vhost.conf /etc/apache2/sites-available/cv.conf
sudo sed -i 's/cv.example.com/YOUR-DOMAIN/g' /etc/apache2/sites-available/cv.conf
sudo a2enmod proxy proxy_http headers
sudo a2ensite cv
sudo apache2ctl configtest && sudo systemctl reload apache2
sudo certbot --apache -d YOUR-DOMAIN
```

### First content

The production image is a Next.js standalone build and does not contain the
seed script. Either create pages through the admin, or copy a database up:

```bash
# on the dev machine, take a consistent copy (the db runs in WAL mode,
# so copying the .db file alone can lose recent writes)
dco exec cv node -e "new (require('better-sqlite3'))(process.env.DATABASE_PATH).exec(\"VACUUM INTO '/srv/data/out.db'\")"
dco cp cv:/srv/data/out.db ./cv.db

# on the server
dco stop cv && cp cv.db data/db/cv.db && rm -f data/db/cv.db-wal data/db/cv.db-shm && dco start cv
```

### Backups

```bash
cp data/db/cv.db backup-$(date +%F).db   # with the stack stopped
tar czf uploads-$(date +%F).tar.gz data/uploads
```

## Notes

- **Two Docker daemons.** deco-pvc and this project both run under Docker
  Desktop (`desktop-linux`). If `dco` cannot reach the daemon, check
  `docker context show`. Running the same stack under two daemons creates
  duplicate containers that fight over host ports.
- **`.next` lives in a named volume**, not the source tree. Docker Desktop
  remaps container root to host uid 100999, so build output written through the
  bind mount ends up unwritable by the user who owns the source.

## License

MIT — see `LICENSE`.
