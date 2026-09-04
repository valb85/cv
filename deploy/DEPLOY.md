# First deploy

Ordered runbook for putting the site on a fresh Ubuntu server behind an
existing Apache. `README.md` explains *why* the pieces are shaped this way;
this file is the sequence to type, plus what to do when a step fails.

Three directories, deliberately kept apart:

| | Path | Owner |
|---|---|---|
| Source checkout | `~/projects/cv` | you |
| Built app | `/srv/cv` | `cv:cv` |
| Database + uploads | `/var/lib/cv` | `cv:cv`, created by systemd |

Nothing belongs in `/var/www/html`. Apache reverse-proxies to Node rather than
serving this site from disk, so it has no document root — and keeping the app
out of the docroot means a misconfigured vhost cannot start handing out
`server.js` and `node_modules` as files.

## 1. Prerequisites

Ubuntu 22.04 ships Node 12; `next` needs ≥20.9 and `better-sqlite3` needs ≥22,
so `build.sh` refuses to run below 22.

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs build-essential python3
sudo npm i -g pnpm
```

`build-essential` and `python3` are not optional: `better-sqlite3` is a native
module and needs a compiler when no prebuild matches the server's Node ABI.

The service account, which owns the app and its data:

```bash
sudo useradd --system --home /srv/cv --shell /usr/sbin/nologin cv
id cv                                   # confirm before continuing
```

Apache needs three modules for the vhost. Missing `proxy` or `headers` stops
Apache from **starting at all**, which takes every other site on the box with
it, so enable them before touching the config:

```bash
sudo a2enmod proxy proxy_http headers
```

## 2. Build

```bash
mkdir -p ~/projects
git clone git@github.com:valb85/cv.git ~/projects/cv
cd ~/projects/cv && git checkout v1.0

./deploy/build.sh                       # assembles into /srv/cv
sudo chown -R cv:cv /srv/cv
```

Use the HTTPS clone URL instead if the server has no SSH key on the GitHub
account. `build.sh` takes an argument if you want somewhere other than
`/srv/cv` — but `cv.service` and the vhost both hardcode that path, so change
all three together or none.

The script builds inside the checkout and copies the result out, so
`node_modules` and `.next` stay in your home directory, not under `/srv`.

## 3. Configuration

```bash
sudo cp deploy/cv.env.example /etc/cv.env
sudo chown root:cv /etc/cv.env && sudo chmod 640 /etc/cv.env

openssl rand -hex 32                    # SESSION_SECRET
openssl rand -hex 8                     # ADMIN_PATH, e.g. /a1b2c3d4e5f60718

sudo nano /etc/cv.env
```

Fill in, at minimum:

- `APP_DOMAIN` and `BASE_URL` — the real domain, not `cv.example.com`
- `SESSION_SECRET` — refuses to issue sessions below 16 characters
- `ADMIN_PATH` — one segment, `[a-z0-9_-]`, three characters or more. A
  malformed value takes the admin offline and logs why rather than quietly
  falling back to `/admin`
- `ADMIN_PASSWORD` — used **once**, see step 6

The file holds a secret and a password in plaintext, hence `640`. Only root and
the `cv` group can read it, and only systemd ever does.

## 4. The service

```bash
sudo cp deploy/cv.service /etc/systemd/system/cv.service
sudo systemctl daemon-reload
sudo systemctl enable --now cv

journalctl -u cv -n 30 --no-pager
ss -ltnp | grep 3000                    # node on 127.0.0.1:3000
```

`EnvironmentFile=/etc/cv.env` loads every variable in that file, so there is no
second place to register a new one. `StateDirectory=cv` creates and owns
`/var/lib/cv` for the database and uploads — outside `/srv/cv`, so a redeploy
overwrites the app without touching the data.

## 5. Apache

```bash
sudo cp deploy/apache-vhost.conf /etc/apache2/sites-available/cv.conf
sudo sed -i 's/cv.example.com/YOUR-DOMAIN/g' /etc/apache2/sites-available/cv.conf

sudo apache2ctl -S > /tmp/before.txt    # snapshot the existing vhosts
sudo a2ensite cv
sudo apache2ctl configtest              # a failed reload keeps the old config
sudo apache2ctl -S | diff /tmp/before.txt -   # only this vhost should appear
sudo systemctl reload apache2           # reload, never restart
```

`ServerName` is not optional: Apache serves the first-loaded vhost to any
request whose Host matches nothing, and `a2ensite` loads alphabetically.

For TLS, `certbot --apache -d YOUR-DOMAIN` — `-d` so certbot leaves your other
vhosts alone. If you add the proxy config to an existing vhost rather than
using a separate one, exclude the ACME path before the catch-all, or renewal
gets proxied into Node:

```apache
ProxyPass /.well-known !
```

## 6. The admin account

`ensureAdminUser` seeds the account on boot **only when the `users` table is
empty**, and never updates an existing one. Confirm it ran:

```bash
journalctl -u cv | grep '\[auth\]'      # expect: created admin user …
```

Then sign in at `https://YOUR-DOMAIN/<ADMIN_PATH>` and change the password
under Settings. That takes `/etc/cv.env` out of the loop as the live
credential.

**If you seed by copying a database up**, the `users` table arrives populated,
the seed is skipped, and production silently inherits the development password
while `ADMIN_PASSWORD` does nothing. Clear the row first:

```bash
sudo systemctl stop cv
sudo -u cv sqlite3 /var/lib/cv/cv.db 'DELETE FROM users;'
sudo systemctl start cv
```

## Every deploy after the first

```bash
cd ~/projects/cv && git pull
./deploy/build.sh
sudo chown -R cv:cv /srv/cv
sudo systemctl restart cv               # applies any new migrations on boot
journalctl -u cv -n 30 --no-pager
```

Rotating `ADMIN_PATH` is an edit to `/etc/cv.env` plus `systemctl restart cv`.
No rebuild — it is read at runtime.

## When it fails

| Symptom | Cause | Fix |
|---|---|---|
| Apache won't start, `Invalid command 'ProxyPreserveHost'` | `mod_proxy` not enabled | `sudo a2enmod proxy proxy_http headers` |
| `503`, log says `Connection refused … 127.0.0.1:3000` | Nothing listening; the app is not running | `systemctl status cv`, then the journal |
| `chown: invalid user: 'cv:cv'` | Service account not created | `useradd` from step 1 |
| `Unit cv.service could not be found` | Unit not installed | Step 4 |
| `Cannot find module '/srv/cv/server.js'` | `build.sh` never ran, or ran with a different target | Step 2 |
| `SESSION_SECRET is missing or too short` | Under 16 characters | `openssl rand -hex 32` |
| `SQLITE_CANTOPEN` | `/var/lib/cv` missing or wrong owner | Check `StateDirectory=cv` and `User=cv` in the unit |
| Site loads unstyled, `/_next/static` 404s | Alias points at a build that isn't there | Step 2, then reload Apache |
| Admin 404s at the secret path | `ADMIN_PATH` malformed or unset | `journalctl -u cv \| grep ADMIN_PATH` |
| Build dies prerendering `/_global-error` | `NODE_ENV=development` inherited by the build | `build.sh` pins it; don't export `NODE_ENV` in the deploy shell |

Backups and database copying are in `README.md`.
