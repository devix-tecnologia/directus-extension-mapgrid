#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const VERBOSE = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
const TEST_SUITE_ID = process.env.TEST_SUITE_ID || 'main';
const DIRECTUS_VERSION = process.env.DIRECTUS_VERSION || '11.14.1';
const CONTAINER_NAME = `directus-mapgrid-${TEST_SUITE_ID}-${DIRECTUS_VERSION}`;

function log(message) {
  if (VERBOSE) {
    console.log(`[E2E] ${message}`);
  }
}

function logError(message) {
  console.error(`[E2E ERROR] ${message}`);
}

async function getDockerComposeCommand() {
  try {
    await execAsync('docker compose version');
    return 'docker compose';
  } catch {
    try {
      await execAsync('docker-compose version');
      return 'docker-compose';
    } catch {
      throw new Error('Neither "docker compose" nor "docker-compose" found.');
    }
  }
}

async function isContainerRunning() {
  try {
    const { stdout } = await execAsync(`docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}"`);
    return stdout.trim() === CONTAINER_NAME;
  } catch {
    return false;
  }
}

async function getContainerPort() {
  try {
    const { stdout } = await execAsync(`docker port ${CONTAINER_NAME} 8055`);
    const match = stdout.trim().match(/:([0-9]+)$/);
    return match ? match[1] : '8055';
  } catch {
    return '8055';
  }
}

async function waitForHealthy(maxWaitSeconds = 180) {
  log(`Waiting for container ${CONTAINER_NAME} to become healthy (timeout: ${maxWaitSeconds}s)...`);
  const startTime = Date.now();
  const maxWaitMs = maxWaitSeconds * 1000;
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const { stdout: status } = await execAsync(
        `docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME}`,
      );
      const currentStatus = status.trim();
      if (currentStatus !== lastStatus) {
        log(`Container status: ${currentStatus}`);
        lastStatus = currentStatus;
      }
      if (currentStatus === 'healthy') {
        log('Container is healthy!');
        return true;
      }
    } catch {
      // container may not exist yet
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (VERBOSE) process.stdout.write('.');
  }

  if (VERBOSE) process.stdout.write('\n');
  logError(`Timeout: container did not become healthy after ${maxWaitSeconds} seconds`);
  return false;
}

async function stopContainer(composeCmd) {
  log(`Stopping existing container ${CONTAINER_NAME}...`);
  try {
    const env = `TEST_SUITE_ID=${TEST_SUITE_ID} DIRECTUS_VERSION=${DIRECTUS_VERSION}`;
    await execAsync(`${env} ${composeCmd} -f docker-compose.test.yml down --remove-orphans --volumes`);
    log('Container stopped successfully');
  } catch {
    log('No container to stop');
  }
}

async function startContainer(composeCmd) {
  log(`Starting container ${CONTAINER_NAME}...`);
  try {
    const env = `TEST_SUITE_ID=${TEST_SUITE_ID} DIRECTUS_VERSION=${DIRECTUS_VERSION}`;
    await execAsync(`${env} ${composeCmd} -f docker-compose.test.yml up -d directus`);
    log('Container started successfully');
  } catch (error) {
    logError(`Failed to start container: ${error.message}`);
    throw error;
  }
}

async function runTests(port) {
  log('Starting E2E tests...');

  const directusUrl = `http://localhost:${port}`;
  log(`Directus URL: ${directusUrl}`);

  const extraArgs = process.argv.slice(2).filter((a) => !a.startsWith('--verbose')).join(' ');
  const testCommand = `DIRECTUS_URL=${directusUrl} npx playwright test ${extraArgs}`;

  return new Promise((resolve, reject) => {
    const child = exec(testCommand, { env: { ...process.env, DIRECTUS_URL: directusUrl } });

    child.stdout.on('data', (data) => process.stdout.write(data));
    child.stderr.on('data', (data) => process.stderr.write(data));

    child.on('close', (code) => {
      if (code === 0) {
        log('Tests completed successfully');
        resolve();
      } else {
        logError(`Tests finished with exit code: ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    log('=== Starting E2E test pipeline ===\n');

    const composeCmd = await getDockerComposeCommand();
    log(`Using: ${composeCmd}`);

    log(`Checking if container ${CONTAINER_NAME} is running...`);
    const isRunning = await isContainerRunning();

    if (isRunning) {
      log('Existing container found, restarting...');
      await stopContainer(composeCmd);
    } else {
      log('No container running');
    }

    await startContainer(composeCmd);

    if (!(await waitForHealthy())) {
      process.exit(1);
    }

    const port = await getContainerPort();
    log(`Container exposed on port: ${port}`);

    await runTests(port);

    log('\n=== E2E test pipeline completed successfully ===');
    process.exit(0);
  } catch (error) {
    logError(`\nPipeline failed: ${error.message}`);
    process.exit(1);
  }
}

main();
