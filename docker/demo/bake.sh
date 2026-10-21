#!/bin/sh
# Seeds a throwaway stack and keeps its database and uploads in
# docker/demo/build/, for docker/demo/Dockerfile to copy into the images: the
# demo then starts already loaded, in seconds.
#
#   pnpm demo:bake
#
# The passwords used here are thrown away: the images set the admin's and the
# database's from their environment on every start.
set -eu
cd "$(dirname "$0")/../.."

OUT=docker/demo/build
PROJECT=mapgrid-bake
COMPOSE="docker compose -p $PROJECT -f docker/demo/bake.compose.yml"
SECRET_OF() { head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

export BAKE_ADMIN_PASSWORD="$(SECRET_OF)" BAKE_DB_PASSWORD="$(SECRET_OF)"
export BAKE_KEY="$(SECRET_OF)" BAKE_SECRET="$(SECRET_OF)"

pnpm demo:seed-bundle
$COMPOSE down -v --remove-orphans >/dev/null 2>&1 || true
$COMPOSE up -d

echo 'Waiting for the seed...'
until docker logs "$PROJECT-directus-1" 2>&1 | grep -q '^\[mapgrid\]'; do sleep 3; done
if ! docker logs "$PROJECT-directus-1" 2>&1 | grep -q '^\[mapgrid\] demo seeded'; then
  docker logs "$PROJECT-directus-1" 2>&1 | tail -30
  $COMPOSE down -v
  exit 1
fi

# no session leaves in the image: its token would sign anyone in as the admin
$COMPOSE stop directus
$COMPOSE exec -T database psql -U directus -d directus -c 'DELETE FROM directus_sessions;'
# a clean shutdown, so the copied database needs no recovery on start
$COMPOSE stop
rm -rf "$OUT/pgdata" "$OUT/uploads"
docker cp "$PROJECT-database-1:/var/lib/postgresql/mapgrid" "$OUT/pgdata"
docker cp "$PROJECT-directus-1:/directus/uploads" "$OUT/uploads"
$COMPOSE down -v

echo "Baked: $OUT/pgdata ($(du -sh "$OUT/pgdata" | cut -f1)), $OUT/uploads ($(ls "$OUT/uploads" | wc -l | tr -d ' ') files)"
