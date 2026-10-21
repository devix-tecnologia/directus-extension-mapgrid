/*
 * The seed the demo image runs on every start, bundled into a single file by
 * `pnpm demo:image`. It reads the same variables Directus does for its admin.
 */
import { DemoSeed } from './demo-seed';

const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) throw new Error('ADMIN_PASSWORD is not set.');

const seed = new DemoSeed({
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword,
  visitor: {
    email: process.env.DEMO_USER_EMAIL || 'publico@example.com',
    password: process.env.DEMO_USER_PASSWORD || 'senha-publica',
  },
});

await seed.run();
await seed.checkReadOnly();
console.log('[mapgrid] demo seeded: read-only for the visitor, closed to anonymous access.');
