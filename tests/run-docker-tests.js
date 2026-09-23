#!/usr/bin/env node

import { exec } from 'node:child_process';
import { statSync } from 'node:fs';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const SUITES = {
  integration: {
    suiteId: 'integration',
    services: 'database directus',
    testCommand: 'npx vitest run --config vitest.integration.config.ts',
  },
  e2e: {
    suiteId: 'main',
    services: 'directus',
    testCommand: 'npx playwright test',
  },
};

const DIRECTUS_INTERNAL_PORT = '8055';
const DEFAULT_DIRECTUS_VERSION = '10.13.1';
const HEALTH_CHECK_TIMEOUT_SECONDS = 180;
const HEALTH_CHECK_POLL_INTERVAL_MS = 3000;

const suiteName = process.argv[2];
const suite = SUITES[suiteName];
const separatorIndex = process.argv.indexOf('--');
const forwardedTestArguments =
  separatorIndex === -1 ? '' : process.argv.slice(separatorIndex + 1).join(' ');

if (!suite) {
  console.error(
    `[RUNNER ERROR] Unknown or missing test suite "${suiteName ?? ''}". Available suites: ${Object.keys(SUITES).join(', ')}. Usage: node tests/run-docker-tests.js <suite> [-- <extra test args>]`
  );
  process.exit(1);
}

const VERBOSE = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
const DIRECTUS_VERSION = process.env.DIRECTUS_VERSION || DEFAULT_DIRECTUS_VERSION;
const CONTAINER_NAME = `directus-mapgrid-${suite.suiteId}-${DIRECTUS_VERSION}`;
const COMPOSE_ENVIRONMENT_PREFIX = `TEST_SUITE_ID=${suite.suiteId} DIRECTUS_VERSION=${DIRECTUS_VERSION}`;
const LABEL = `[${suiteName.toUpperCase()}]`;

function log(message) {
  if (VERBOSE) {
    console.log(`${LABEL} ${message}`);
  }
}

function logError(message) {
  console.error(`${LABEL} ERROR ${message}`);
}

/*
 * O compose monta `./dist/index.js` como arquivo. Se o build ainda nao existe,
 * o Docker nao reclama: cria no host um DIRETORIO vazio com esse nome, do root.
 * O Directus sobe sem a extensao, a suite falha por um motivo que nao e o dela,
 * e o `pnpm build` seguinte passa a morrer com EISDIR ate alguem apagar o
 * diretorio com privilegio de root. Por isso a checagem vem antes de subir.
 */
const BUILT_EXTENSION = 'dist/index.js';

function assertExtensionIsBuilt() {
  let stats;
  try {
    stats = statSync(BUILT_EXTENSION);
  } catch {
    throw new Error(
      `${BUILT_EXTENSION} not found. Run "pnpm build" before the ${suiteName} suite.`
    );
  }
  if (!stats.isFile()) {
    throw new Error(
      `${BUILT_EXTENSION} is a directory, left behind by a Docker bind mount that ran before the build. ` +
        'Remove it (it is owned by root: docker run --rm -v "$PWD":/w alpine rm -rf /w/dist) and run "pnpm build".'
    );
  }
}

async function resolveDockerComposeCommand() {
  try {
    await execAsync('docker compose version');
    return 'docker compose';
  } catch {
    try {
      await execAsync('docker-compose version');
      return 'docker-compose';
    } catch {
      throw new Error('Neither "docker compose" nor "docker-compose" is available on PATH.');
    }
  }
}

async function isDirectusContainerRunning() {
  try {
    const { stdout } = await execAsync(
      `docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}"`
    );
    return stdout.trim() === CONTAINER_NAME;
  } catch {
    return false;
  }
}

async function waitForHealthyContainer(maxWaitSeconds = HEALTH_CHECK_TIMEOUT_SECONDS) {
  log(`Waiting for container ${CONTAINER_NAME} to become healthy (timeout: ${maxWaitSeconds}s)...`);
  const deadline = Date.now() + maxWaitSeconds * 1000;
  let lastReportedStatus = '';

  while (Date.now() < deadline) {
    try {
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME}`
      );
      const status = stdout.trim();
      if (status !== lastReportedStatus) {
        log(`Container status: ${status}`);
        lastReportedStatus = status;
      }
      if (status === 'healthy') {
        log('Container is healthy!');
        return true;
      }
    } catch {
      log('Container not inspectable yet, retrying...');
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_POLL_INTERVAL_MS));
  }

  logError(`Timeout: container did not become healthy within ${maxWaitSeconds} seconds`);
  return false;
}

async function stopContainers(composeCommand) {
  log('Stopping existing containers...');
  try {
    await execAsync(
      `${COMPOSE_ENVIRONMENT_PREFIX} ${composeCommand} -f docker-compose.test.yml down --remove-orphans --volumes`
    );
    log('Containers stopped');
  } catch {
    log('No containers to stop');
  }
}

async function startContainers(composeCommand) {
  log(`Starting containers (${suite.services})...`);
  try {
    await execAsync(
      `${COMPOSE_ENVIRONMENT_PREFIX} ${composeCommand} -f docker-compose.test.yml up -d ${suite.services}`
    );
    log('Containers started');
  } catch (error) {
    logError(`Failed to start containers: ${error.message}`);
    throw error;
  }
}

async function getExposedDirectusPort() {
  try {
    const { stdout } = await execAsync(`docker port ${CONTAINER_NAME} ${DIRECTUS_INTERNAL_PORT}`);
    const match = stdout.trim().match(/:(\d+)$/m);
    if (!match) throw new Error(`Could not parse "docker port" output: ${stdout.trim()}`);
    return match[1];
  } catch (error) {
    logError(`Failed to resolve exposed port: ${error.message}`);
    throw error;
  }
}

async function runTests(directusUrl) {
  log(`Running ${suiteName} tests against ${directusUrl}...`);

  const fullTestCommand = `${suite.testCommand} ${forwardedTestArguments}`.trim();

  return new Promise((resolve, reject) => {
    const child = exec(fullTestCommand, {
      env: { ...process.env, DIRECTUS_URL: directusUrl },
    });

    child.stdout.on('data', (chunk) => process.stdout.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));

    child.on('close', (code) => {
      if (code === 0) {
        log('Tests completed successfully');
        resolve();
      } else {
        reject(new Error(`Tests finished with exit code ${code}`));
      }
    });
  });
}

async function main() {
  let composeCommand;

  try {
    log(`=== ${suiteName} test pipeline started ===\n`);

    assertExtensionIsBuilt();

    composeCommand = await resolveDockerComposeCommand();
    log(`Using: ${composeCommand}`);

    if (await isDirectusContainerRunning()) {
      log('Existing container found, restarting...');
      await stopContainers(composeCommand);
    }

    await startContainers(composeCommand);

    if (!(await waitForHealthyContainer())) {
      throw new Error('Directus container never became healthy');
    }

    const port = await getExposedDirectusPort();
    await runTests(`http://localhost:${port}`);

    log('\n=== Stopping containers ===');
    await stopContainers(composeCommand);

    log(`\n=== ${suiteName} test pipeline completed successfully ===`);
    process.exit(0);
  } catch (error) {
    logError(`Pipeline failed: ${error.message}`);

    if (composeCommand) {
      log('Cleaning up containers...');
      await stopContainers(composeCommand);
    }

    process.exit(1);
  }
}

main();
