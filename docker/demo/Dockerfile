# The read-only MapGrid demo, as two images that start already loaded:
#
#   --target directus   Directus with the MapGrid extension and the demo's photos
#   --target database   PostGIS with the demo's database (linux/amd64 only, as PostGIS)
#
# Run `pnpm demo:bake` first: it fills docker/demo/build/. See docker/demo/README.md.
ARG DIRECTUS_VERSION=11.17.4

FROM directus/directus:${DIRECTUS_VERSION} AS directus

ARG MAPGRID_VERSION=2.0.0

LABEL org.opencontainers.image.title="Directus + MapGrid" \
      org.opencontainers.image.description="Directus with the directus-extension-mapgrid layout installed and a read-only demo collection configured to use it." \
      org.opencontainers.image.source="https://github.com/devix-tecnologia/directus-extension-mapgrid" \
      org.opencontainers.image.licenses="MIT"

USER root
# the extension exactly as published on npm
ADD https://registry.npmjs.org/@devix-tecnologia/directus-extension-mapgrid/-/directus-extension-mapgrid-${MAPGRID_VERSION}.tgz /tmp/mapgrid.tgz
RUN mkdir -p /directus/extensions/directus-extension-mapgrid \
 && tar -xzf /tmp/mapgrid.tgz --strip-components=1 -C /directus/extensions/directus-extension-mapgrid \
 && rm /tmp/mapgrid.tgz \
 && chown -R node:node /directus/extensions
COPY --chmod=755 docker/demo/entrypoint.sh /directus/mapgrid-demo-entrypoint.sh
COPY docker/demo/build/mapgrid-demo-seed.mjs /directus/mapgrid-demo-seed.mjs
# the photos the baked database points to
COPY --chown=node:node docker/demo/build/uploads /directus/uploads
USER node

# ACCEPT_TERMS: the licence is accepted on bootstrap, so the app never shows the first-run setup form
ENV EXTENSIONS_PATH=/directus/extensions \
    ADMIN_EMAIL=admin@example.com \
    ACCEPT_TERMS=true \
    RATE_LIMITER_ENABLED=true \
    RATE_LIMITER_POINTS=100 \
    RATE_LIMITER_DURATION=1 \
    LOG_LEVEL=warn

CMD ["/directus/mapgrid-demo-entrypoint.sh"]

FROM postgis/postgis:15-3.3-alpine AS database

LABEL org.opencontainers.image.title="PostGIS with the MapGrid demo" \
      org.opencontainers.image.description="PostGIS with the read-only MapGrid demo database already loaded, for the directus-mapgrid image." \
      org.opencontainers.image.source="https://github.com/devix-tecnologia/directus-extension-mapgrid" \
      org.opencontainers.image.licenses="MIT"

# outside the base image's VOLUME, so the data lives in the image and a new container starts from it
ENV PGDATA=/var/lib/postgresql/mapgrid \
    POSTGRES_DB=directus \
    POSTGRES_USER=directus
COPY --chown=postgres:postgres --chmod=700 docker/demo/build/pgdata /var/lib/postgresql/mapgrid
COPY --chmod=755 docker/demo/database-entrypoint.sh /usr/local/bin/mapgrid-database-entrypoint.sh

ENTRYPOINT ["mapgrid-database-entrypoint.sh"]
