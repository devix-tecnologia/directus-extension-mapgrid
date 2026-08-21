import axios from 'axios';
import { setupTestEnv, testEnv } from './test-env.js';
import { logger } from './test-logger.js';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown,
  token?: string,
): Promise<Record<string, unknown>> {
  const url = `${DIRECTUS_URL}${path}`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await axios({ method, url, data, headers, timeout: 30000, validateStatus: () => true });

  if (response.status >= 400) {
    const body = response.data as Record<string, unknown>;
    const msg = (body?.errors as Array<Record<string, unknown>>)?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`API ${method} ${path}: ${msg}`);
  }

  return response.data as Record<string, unknown>;
}

async function waitForDirectus(retries = 60, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const health = await apiRequest('GET', '/server/health');
      if (health.status === 'ok') {
        logger.info('Directus is healthy');
        return;
      }
    } catch {
      // not ready yet
    }
    logger.debug(`Waiting for Directus... (attempt ${i + 1}/${retries})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('Directus failed to start');
}

export async function setupTestEnvironment(_testSuiteId = 'main') {
  try {
    setupTestEnv();
    logger.info(`Connecting to Directus at ${DIRECTUS_URL}...`);

    await waitForDirectus();

    const loginResponse = await apiRequest('POST', '/auth/login', {
      email: testEnv.DIRECTUS_ADMIN_EMAIL,
      password: testEnv.DIRECTUS_ADMIN_PASSWORD,
    });

    const accessToken =
      (loginResponse.data as Record<string, string>)?.access_token ||
      (loginResponse as Record<string, string>).access_token;

    process.env.DIRECTUS_ACCESS_TOKEN = accessToken;
    logger.info('Logged in successfully');
    return accessToken;
  } catch (error) {
    logger.error('Failed to setup test environment:', error);
    throw error;
  }
}

export async function teardownTestEnvironment(_testSuiteId = 'main') {
  logger.info('Teardown complete');
}
