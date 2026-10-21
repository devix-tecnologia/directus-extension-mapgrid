#!/bin/sh
# The database comes loaded in the image; only its password comes from the
# environment, set before the server starts so the baked one never works.
set -e

if [ -z "$POSTGRES_PASSWORD" ]; then
  echo '[mapgrid] set POSTGRES_PASSWORD: the baked database password is not for use.' >&2
  exit 1
fi

escaped=$(printf '%s' "$POSTGRES_PASSWORD" | sed "s/'/''/g")
echo "ALTER USER directus PASSWORD '$escaped';" \
  | su-exec postgres postgres --single -D "$PGDATA" postgres >/dev/null

exec docker-entrypoint.sh postgres
