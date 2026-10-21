# Directus with the MapGrid layout extension installed and a read-only demo
# configured on start. Built by `pnpm demo:image`; see docker/demo/README.md.
ARG DIRECTUS_VERSION=11.17.4
FROM directus/directus:${DIRECTUS_VERSION}

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
USER node

# ACCEPT_TERMS: the licence is accepted on bootstrap, so the app never shows the first-run setup form
ENV EXTENSIONS_PATH=/directus/extensions \
    ACCEPT_TERMS=true \
    RATE_LIMITER_ENABLED=true \
    RATE_LIMITER_POINTS=100 \
    RATE_LIMITER_DURATION=1 \
    LOG_LEVEL=warn

CMD ["/directus/mapgrid-demo-entrypoint.sh"]
