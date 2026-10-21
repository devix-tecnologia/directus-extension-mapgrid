#!/bin/sh
# The database comes loaded in the image; only its password comes from the
# environment, set before the server starts so the baked one never works.
# Sessions are dropped too: a session token baked into a public image would
# sign anyone in, whatever the password.
set -e

if [ -z "$POSTGRES_PASSWORD" ]; then
  echo '[mapgrid] set POSTGRES_PASSWORD: the baked database password is not for use.' >&2
  exit 1
fi

escaped=$(printf '%s' "$POSTGRES_PASSWORD" | sed "s/'/''/g")
printf "ALTER USER directus PASSWORD '%s';\n" "$escaped" \
  | su-exec postgres postgres --single -D "$PGDATA" postgres >/dev/null
echo 'DELETE FROM directus_sessions;' \
  | su-exec postgres postgres --single -D "$PGDATA" directus >/dev/null

exec docker-entrypoint.sh postgres
