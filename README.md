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
deploy/               non-Docker production: vhost, systemd unit, build script
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

Target: Ubuntu 22.04 with Apache. **No Docker in production** — Docker is the
local development setup only.

Apache cannot run Next.js the way it runs PHP; there is no `mod_next`. The app
is a Node server, systemd supervises it, and Apache reverse-proxies to it on
loopback.

### Once, on the server

Ubuntu 22.04 ships Node 12, which is far too old — `next` needs ≥20.9 and
`better-sqlite3` needs ≥22:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3
sudo npm i -g pnpm
sudo useradd --system --home /srv/cv cv
```

Configuration, kept out of the repo because it holds the session secret and the
admin password:

```bash
sudo cp deploy/cv.env.example /etc/cv.env
sudo chown root:cv /etc/cv.env && sudo chmod 640 /etc/cv.env
openssl rand -hex 32                      # SESSION_SECRET
sudo nano /etc/cv.env                      # + APP_DOMAIN, BASE_URL, ADMIN_PASSWORD
```

The service, which creates and owns `/var/lib/cv` for the database and uploads:

```bash
sudo cp deploy/cv.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable cv
```

The vhost — `deploy/apache-vhost.conf` carries its own step-by-step comments,
including how to check you have not disturbed the vhosts already on the box:

```bash
sudo apache2ctl -S > /tmp/before.txt        # snapshot first
sudo cp deploy/apache-vhost.conf /etc/apache2/sites-available/cv.conf
sudo sed -i 's/cv.example.com/YOUR-DOMAIN/g' /etc/apache2/sites-available/cv.conf
sudo a2enmod proxy proxy_http headers
sudo a2ensite cv
sudo apache2ctl configtest                  # a failed reload keeps the old config
sudo apache2ctl -S | diff /tmp/before.txt - # only your vhost should appear
sudo systemctl reload apache2               # reload, never restart
sudo certbot --apache -d YOUR-DOMAIN        # -d, so other vhosts are left alone
```

### Every deploy

```bash
cd /srv/src && git pull
./deploy/build.sh /srv/cv
sudo chown -R cv:cv /srv/cv
sudo systemctl restart cv
journalctl -u cv -n 30
```

`build.sh` installs, builds, and assembles into the deploy directory.
`output: 'standalone'` gives a self-contained `server.js` and a pruned
`node_modules`, but the tracer leaves out `.next/static`, `public/` and
`drizzle/` — the script copies those in. Skip them and you get a running site
with no CSS, no images, and a migration failure on boot.

Build **on the server**: `better-sqlite3` is a native module and its binary has
to match the Node ABI and libc it runs against.

Migrations and the admin account are applied on boot by
`src/instrumentation.ts`, so a restart is the whole deploy.

### First content

The standalone build does not contain the seed script. Either create pages
through the admin, or copy a database up:

```bash
# on the dev machine — the db runs in WAL mode, so copying the .db file
# alone can lose recent writes
dco exec cv node -e "new (require('better-sqlite3'))(process.env.DATABASE_PATH).exec(\"VACUUM INTO '/srv/data/out.db'\")"
dco cp cv:/srv/data/out.db ./cv.db

# on the server
sudo systemctl stop cv
sudo -u cv cp cv.db /var/lib/cv/cv.db
sudo -u cv rm -f /var/lib/cv/cv.db-wal /var/lib/cv/cv.db-shm
sudo systemctl start cv
```

### Backups

Everything that matters is in `/var/lib/cv`:

```bash
sudo -u cv sqlite3 /var/lib/cv/cv.db "VACUUM INTO '/var/lib/cv/backup-$(date +%F).db'"
sudo tar czf uploads-$(date +%F).tar.gz -C /var/lib/cv uploads
```

`VACUUM INTO` takes a consistent copy without stopping the service.

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
