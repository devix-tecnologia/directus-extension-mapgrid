/**
 * The test stack's credentials, in one place.
 *
 * The same pair is written in `docker-compose.test.yml`, which cannot read
 * TypeScript — `test-env.test.ts` compares the two so they cannot drift apart
 * in silence.
 */
export const testEnv = {
  DIRECTUS_ADMIN_EMAIL: 'admin@example.com',
  DIRECTUS_ADMIN_PASSWORD: 'admin123',
} as const;

/** One line naming where Directus is and how to sign in, for the runners to print. */
export const credentialsLine = (url: string): string =>
  `${url} — ${testEnv.DIRECTUS_ADMIN_EMAIL} / ${testEnv.DIRECTUS_ADMIN_PASSWORD}`;
