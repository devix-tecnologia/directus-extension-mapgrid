#!/usr/bin/env node
/*
 * Brings up the e2e Directus stack (docker-compose.test.yml) and leaves it
 * running with the seeded test collection, so the MapGrid layout can be used
 * by hand in a browser.
 *
 *   pnpm test:collection            # up + seed, and leave the stack running
 *   pnpm test:collection down       # stop and wipe the stack (--volumes)
 *
 * The default port is 8065; set DIRECTUS_PORT to pick another. The seed is the
 * e2e global-setup itself — same collection, same items, same preset — run
 * through Vitest, which resolves the tests' extensionless imports. Nothing is
 * torn down afterwards: the point is to keep Directus reachable.
 */

import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const DIRECTUS_VERSION = process.env.DIRECTUS_VERSION ?? '10.13.1';
const DIRECTUS_PORT = process.env.DIRECTUS_PORT ?? '8065';
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;

const composeEnv = `TEST_SUITE_ID=main DIRECTUS_VERSION=${DIRECTUS_VERSION} DIRECTUS_PORT=${DIRECTUS_PORT} PUBLIC_URL=${DIRECTUS_URL}`;

const compose = (args: string): void => {
  execSync(`${composeEnv} docker compose -f docker-compose.test.yml ${args}`, {
    stdio: 'inherit',
  });
};

const main = async (): Promise<void> => {
  if (process.argv.includes('down')) {
    compose('down --remove-orphans --volumes');
    return;
  }

  const distStats = statSync('dist/index.js', { throwIfNoEntry: false });
  if (!distStats?.isFile()) {
    throw new Error('dist/index.js not found. Run "pnpm build" first.');
  }

  compose('up -d database directus');

  execSync('pnpm exec vitest run --config vitest.seed.config.ts', {
    stdio: 'inherit',
    env: { ...process.env, DIRECTUS_URL: DIRECTUS_URL },
  });

  console.log(`
Directus is up with the test collections seeded:
  ${DIRECTUS_URL}
  admin@example.com / admin123
  - "test_mapgrid_items" — the e2e baseline
  - "test_mapgrid_person_track" — Test Person Track: five people crossing Vitória, on the MapGrid layout

Tear it down with: pnpm test:collection down`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
