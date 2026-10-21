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

using the [`docker-compose.yml`](docker-compose.yml) beside this file. The
database is `sidartaveloso/directus-mapgrid-db`, PostGIS with the demo
already loaded (linux/amd64 only, as PostGIS). The photos are inside the
Directus image. Give neither container a volume: a new container starts from
the loaded demo in seconds.

Visitors sign in as `publico@example.com` / `senha-publica`. The login page
shows these credentials. Visitors can read but not change, add or upload
anything, and anonymous access is closed. Nothing is kept on disk: each
restart goes back to the demo as it was loaded. The seed runs on every start
of Directus and deletes the comments and bookmarks the visitor left. Directus
grants those to every app user, and no permission takes them away.

| Variable | |
|---|---|
| `ADMIN_PASSWORD` | Required. The admin's password, set on every start; the image refuses to start without it. |
| `POSTGRES_PASSWORD` | Required by the database image, set on every start; Directus' `DB_PASSWORD` must match. |
| `ADMIN_EMAIL` | The admin's email, `admin@example.com` by default. |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | The visitor's credentials. |
| `PUBLIC_URL`, `KEY`, `SECRET`, `DB_*` | As in any [Directus](https://directus.io/docs/configuration/general). |

## Build

```bash
pnpm demo:bake    # seeds a throwaway stack; keeps its database and uploads in docker/demo/build/
docker buildx build --platform linux/amd64,linux/arm64 -f docker/demo/Dockerfile --target directus \
  --build-arg MAPGRID_VERSION=2.0.0 -t <namespace>/directus-mapgrid:2.0.0 --push .
docker buildx build --platform linux/amd64 -f docker/demo/Dockerfile --target database \
  -t <namespace>/directus-mapgrid-db:2.0.0 --push .
```

The extension comes from npm at the version given in `MAPGRID_VERSION`. Bake
again whenever the seed changes. The passwords used in baking are thrown away.
