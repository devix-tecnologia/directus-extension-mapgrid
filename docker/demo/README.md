# Directus + MapGrid

[Directus](https://directus.io) 11 with the
[MapGrid](https://www.npmjs.com/package/@devix-tecnologia/directus-extension-mapgrid)
layout extension installed, and a read-only demo configured on start: a
collection of licence plate readings in Grande Vitória, with photos, shown
in MapGrid. The map, the grid, the capture card, the trail, the playback and
the guided tour are all switched on.

## Run

```bash
KEY=$(openssl rand -hex 32) SECRET=$(openssl rand -hex 32) \
ADMIN_PASSWORD=change-me PUBLIC_URL=https://your.domain \
docker compose up -d
```

using the [`docker-compose.yml`](docker-compose.yml) beside this file. It
needs PostgreSQL with PostGIS. Give neither container a volume.

Visitors sign in as `publico@example.com` / `senha-publica`. The login page
shows these credentials. Visitors can read but not change, add or upload
anything, and anonymous access is closed. Nothing is kept on disk: each
restart starts from an empty database, and the seed loads the demo again.
The seed also deletes the comments and bookmarks the visitor left. Directus
grants those to every app user, and no permission takes them away.

| Variable | |
|---|---|
| `ADMIN_PASSWORD` | Required. The admin's password; the image refuses to start without it. |
| `ADMIN_EMAIL` | The admin's email, `admin@example.com` by default. |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | The visitor's credentials. |
| `PUBLIC_URL`, `KEY`, `SECRET`, `DB_*` | As in any [Directus](https://directus.io/docs/configuration/general). |

## Build

```bash
pnpm demo:seed-bundle
docker buildx build --platform linux/amd64,linux/arm64 -f docker/demo/Dockerfile \
  --build-arg MAPGRID_VERSION=2.0.0 -t <namespace>/directus-mapgrid:2.0.0 --push .
```

The extension comes from npm at the version given in `MAPGRID_VERSION`.
