export const testEnv = {
  DB_CLIENT: 'pg',
  DB_HOST: 'database',
  DB_PORT: '5432',
  DB_DATABASE: 'directus',
  DB_USER: 'directus',
  DB_PASSWORD: 'directus',
  DIRECTUS_KEY: 'test-key',
  DIRECTUS_SECRET: 'test-secret',
  DIRECTUS_ADMIN_EMAIL: 'admin@example.com',
  DIRECTUS_ADMIN_PASSWORD: 'admin123',
  DIRECTUS_PUBLIC_URL: 'http://directus:8055',
  DIRECTUS_INTERNAL_URL: 'http://localhost:8055',
  STORAGE_LOCAL_ROOT: '/directus/uploads',
};

export function setupTestEnv() {
  const originalEnv = { ...process.env };

  Object.entries(testEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });

  return () => {
    Object.keys(testEnv).forEach((key) => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    });
  };
}
