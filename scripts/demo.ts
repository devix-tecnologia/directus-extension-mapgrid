#!/usr/bin/env node
/*
 * Brings up the read-only demo (docker-compose.demo.yml) and seeds it.
 *
 *   DEMO_ADMIN_PASSWORD=... pnpm demo        # up + seed; safe to run again
 *   DEMO_ADMIN_PASSWORD=... pnpm demo seed   # seed only — undoes what visitors changed
 *   pnpm demo down                           # stop, keeping the data
 *
 * DEMO_PORT (8070), DEMO_PUBLIC_URL, DEMO_USER_EMAIL and DEMO_USER_PASSWORD
 * are optional. The seed ends by checking, as the visitor, that reading works
 * and writing is refused — a demo that turned writable fails here.
 */

import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const DEMO_PORT = process.env.DEMO_PORT ?? '8070';
const DEMO_URL = `http://localhost:${DEMO_PORT}`;

const compose = (args: string): void => {
  execSync(`docker compose -f docker-compose.demo.yml ${args}`, { stdio: 'inherit' });
};

const seed = (): void => {
  execSync('pnpm exec vitest run --config vitest.demo.config.ts', {
    stdio: 'inherit',
    env: { ...process.env, DIRECTUS_URL: DEMO_URL },
  });
};

const main = (): void => {
  const command = process.argv[2];
  if (command === 'down') {
    compose('down');
    return;
  }

  if (!process.env.DEMO_ADMIN_PASSWORD) {
    throw new Error('Set DEMO_ADMIN_PASSWORD: the demo never runs with a default admin password.');
  }

  if (command !== 'seed') {
    if (!statSync('dist/index.js', { throwIfNoEntry: false })?.isFile()) {
      throw new Error('dist/index.js not found. Run "pnpm build" first.');
    }
    compose('up -d --wait');
  }

  seed();

  console.log(`
The MapGrid demo is up, read-only: ${DEMO_URL}
  visitors: ${process.env.DEMO_USER_EMAIL || 'publico@example.com'} / ${process.env.DEMO_USER_PASSWORD || 'senha-publica'}

Stop it with: pnpm demo down`);
};

try {
  main();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
