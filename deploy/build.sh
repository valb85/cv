#!/usr/bin/env bash
#
# Builds the app and assembles it into the deploy directory.
#
#   ./deploy/build.sh                 # builds into /srv/cv
#   ./deploy/build.sh /opt/cv         # or somewhere else
#
# `output: 'standalone'` in next.config.ts produces server.js plus a pruned
# node_modules, but the tracer deliberately leaves out static assets and
# anything read from disk at runtime. Those three copies below are that gap -
# skip them and you get a running site with no CSS, no images, and a migration
# failure on boot.
#
# Run this on the server. better-sqlite3 is a native module, so its binary has
# to match the Node ABI and libc it will run against.

set -Eeuo pipefail

TARGET="${1:-/srv/cv}"
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/../apps/web-cv" && pwd)"

command -v pnpm >/dev/null || { echo "pnpm not found"; exit 1; }

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then
  echo "Node $node_major is too old: next needs >=20.9 and better-sqlite3 needs >=22." >&2
  exit 1
fi

echo "==> building in $APP"
cd "$APP"
pnpm install --frozen-lockfile
# Set explicitly rather than left to next's default: `next build` fills NODE_ENV
# in only when it is empty, so a shell that already exports development - as the
# dev container does - silently produces a production build running the
# development runtime, which dies prerendering /_global-error.
NODE_ENV=production pnpm run build

echo "==> assembling into $TARGET"
mkdir -p "$TARGET"
# Replace the app, but never touch the data - the database and uploads live
# under /var/lib/cv, outside this directory, precisely so this is safe.
rm -rf "$TARGET/.next" "$TARGET/public" "$TARGET/drizzle" "$TARGET/node_modules" "$TARGET/server.js"

cp -r .next/standalone/. "$TARGET/"
cp -r .next/static       "$TARGET/.next/static"
cp -r public             "$TARGET/public"
cp -r drizzle            "$TARGET/drizzle"

echo
echo "assembled. next:"
echo "  sudo chown -R cv:cv $TARGET"
echo "  sudo systemctl restart cv     # applies any new migrations on boot"
echo "  journalctl -u cv -n 30"
