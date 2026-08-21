import {
  apiRequest,
  DIRECTUS_URL,
  type DirectusSingleResponse,
  isDirectusHealthy,
  setAccessToken,
} from './helpers/directus-api.js';
import { waitForCondition } from './helpers/wait.js';
import { testEnv } from './test-env.js';
import { logger } from './test-logger.js';

interface AdminSession {
  access_token: string;
}

const HEALTH_POLL_INTERVAL_MS = 2_000;
const HEALTH_TIMEOUT_MS = 180_000;

export async function setupTestEnvironment(): Promise<string> {
  try {
    logger.info(`Connecting to Directus at ${DIRECTUS_URL}...`);
    await waitForCondition(isDirectusHealthy, {
      intervalMs: HEALTH_POLL_INTERVAL_MS,
      timeoutMs: HEALTH_TIMEOUT_MS,
    });

    const session = await apiRequest<DirectusSingleResponse<AdminSession>>('POST', '/auth/login', {
      email: testEnv.DIRECTUS_ADMIN_EMAIL,
      password: testEnv.DIRECTUS_ADMIN_PASSWORD,
    });

    setAccessToken(session.data.access_token);
    logger.info('Logged in successfully');
    return session.data.access_token;
  } catch (error) {
    logger.error('Failed to set up the test environment:', error);
    throw error;
  }
}
