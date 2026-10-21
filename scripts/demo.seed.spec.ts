import { it } from 'vitest';
import { DemoSeed } from './demo/index';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

it('seeds the demo and leaves it read-only', async () => {
  const seed = new DemoSeed({
    adminEmail: process.env.DEMO_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: required('DEMO_ADMIN_PASSWORD'),
    visitor: {
      email: process.env.DEMO_USER_EMAIL || 'publico@example.com',
      password: process.env.DEMO_USER_PASSWORD || 'senha-publica',
    },
  });

  await seed.run();
  await seed.checkReadOnly();
});
