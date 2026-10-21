#!/bin/sh
# Starts Directus and, beside it, the seed that turns it into the read-only
# MapGrid demo. A failed seed is logged and leaves Directus running.
set -e

if [ -z "$ADMIN_PASSWORD" ]; then
  echo '[mapgrid] set ADMIN_PASSWORD: the demo never runs with a generated or default admin password.' >&2
  exit 1
fi

node cli.js bootstrap

DIRECTUS_URL="http://127.0.0.1:${PORT:-8055}" node /directus/mapgrid-demo-seed.mjs \
  || echo '[mapgrid] the demo seed failed; Directus keeps running.' >&2 &

exec pm2-runtime start ecosystem.config.cjs
