#!/usr/bin/env node
/**
 * Proves, at the end of the setup, that the environment delivers what the
 * prompt promises.
 *
 * Every check here exists because the matching failure shows up FAR from its
 * cause if nobody looks now:
 *
 *   * without `node_modules`, the agent sees "Cannot find module" and tries to
 *     fix the install — that is how a whole round was lost in geohub;
 *   * without `dist/index.js`, `docker-compose.test.yml` mounts an empty
 *     DIRECTORY in place of the file (Docker creates it instead of failing),
 *     Directus comes up without the extension, and the e2e fails for a reason
 *     that is not its own;
 *   * without a reachable Docker, `pnpm test:e2e` dies in the middle of the
 *     task — and the e2e is where this repository's open tasks prove
 *     themselves;
 *   * without the mirror, Docker exists but mounts empty paths, which is the
 *     most expensive of the four to diagnose.
 *
 * Failing here costs the setup. Failing later costs the round.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const problems = [];

function nonEmptyFile(path, explanation) {
  try {
    const info = statSync(join(root, path));
    if (info.isDirectory()) {
      problems.push(`${path} is a DIRECTORY — ${explanation}`);
    } else if (info.size === 0) {
      problems.push(`${path} is empty — ${explanation}`);
    }
  } catch {
    problems.push(`${path} does not exist — ${explanation}`);
  }
}

function directory(path, explanation) {
  try {
    if (!statSync(join(root, path)).isDirectory()) {
      problems.push(`${path} is not a directory — ${explanation}`);
    }
  } catch {
    problems.push(`${path} does not exist — ${explanation}`);
  }
}

directory('node_modules', 'the install did not go through; the agent cannot fix that from here');
nonEmptyFile('dist/index.js', 'the extension build did not come out, and the e2e mounts this file');

try {
  execFileSync('docker', ['info'], { stdio: 'pipe' });
} catch (error) {
  problems.push(
    `docker info failed (${String(error.message).split('\n')[0]}) — the host socket did not ` +
      'reach the container, or the user is not in its group; without it there is no e2e'
  );
}

try {
  execFileSync('bash', [join(root, '.sandcastle', 'on-mirror.sh'), 'true'], { stdio: 'pipe' });
} catch (error) {
  problems.push(
    `on-mirror.sh failed (${String(error.stderr ?? error.message)
      .trim()
      .split('\n')
      .pop()}) — Docker would see empty paths, and the suite would run on nothing`
  );
}

if (problems.length > 0) {
  console.error('✗ incomplete environment:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('✓ environment ready: node_modules, dist/index.js, docker and the worktree mirror');
