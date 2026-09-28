import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { credentialsLine, testEnv } from './test-env';

/*
 * Read with a regex, not a YAML parser: the repository has no YAML dependency,
 * and pulling one in to read two lines would cost more than it explains.
 */
const composeValue = (key: string): string | undefined => {
  const compose = readFileSync(join(import.meta.dirname, '..', 'docker-compose.test.yml'), 'utf8');
  return new RegExp(`^\\s*${key}:\\s*'([^']+)'`, 'm').exec(compose)?.[1];
};

describe('the test stack credentials', () => {
  it('are the same in test-env.ts and in docker-compose.test.yml', () => {
    // Drift here is expensive and quiet: the stack boots with one admin and
    // every test signs in as another, so the suite fails at the login screen
    // and blames whatever it was measuring.
    expect(composeValue('ADMIN_EMAIL')).toBe(testEnv.DIRECTUS_ADMIN_EMAIL);
    expect(composeValue('ADMIN_PASSWORD')).toBe(testEnv.DIRECTUS_ADMIN_PASSWORD);
  });

  it('own the project, so the admin is also PROJECT_OWNER', () => {
    expect(composeValue('PROJECT_OWNER')).toBe(testEnv.DIRECTUS_ADMIN_EMAIL);
  });

  it('are printed with the url the runners hand out', () => {
    expect(credentialsLine('http://localhost:8065')).toBe(
      'http://localhost:8065 — admin@example.com / admin123'
    );
  });
});
