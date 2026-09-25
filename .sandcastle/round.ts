import { execFileSync } from 'node:child_process';

import { claudeCode, createSandbox } from '@ai-hero/sandcastle';

import { SETUP, sandboxDocker } from './environment.ts';
import { RoundPublisher } from './round-publisher/index.ts';

/**
 * Round mode: one sandbox setup for several tasks.
 *
 * `createSandbox()` integrates nothing on `close()`, so the round publishes its
 * own branch through `RoundPublisher`: rebased on the freshest `target`, gated,
 * merged and pushed, or kept when any of that fails.
 *
 * Run with: pnpm sandcastle:round
 */

/** How many tasks the agent closes in this round; `ITERATIONS=1` sends only the first one. */
const ITERATIONS = Number(process.env.ITERATIONS ?? 3);
if (!Number.isInteger(ITERATIONS) || ITERATIONS < 1) {
  throw new Error(`ITERATIONS must be an integer >= 1; it came as ${process.env.ITERATIONS}`);
}

const BRANCH = `sandcastle/round-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

function git(...args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const GATES = [
  ['install', '--frozen-lockfile'],
  ['typecheck'],
  ['typecheck:sandcastle'],
  ['lint'],
  ['test'],
];

function runGates(): boolean {
  try {
    for (const gate of GATES) execFileSync('pnpm', gate, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

const publisher = new RoundPublisher({ git, remote: 'origin', runGates, log: console.log });

const target = git('rev-parse', '--abbrev-ref', 'HEAD');
console.log(`round: branch ${BRANCH}, target ${target}, ${ITERATIONS} iteration(s)`);
publisher.syncTarget(target);

const sandbox = await createSandbox({
  branch: BRANCH,
  sandbox: sandboxDocker(),
  hooks: { sandbox: { onSandboxReady: [SETUP] } },
});

let commits = 0;
let worktreePreserved = false;
try {
  const result = await sandbox.run({
    agent: claudeCode('claude-opus-5'),
    promptFile: './.sandcastle/prompt.md',
    maxIterations: ITERATIONS,
  });

  console.log(
    `\nround: ${result.iterations.length} iteration(s), ${result.commits.length} commit(s)`
  );
  for (const commit of result.commits) console.log(`  ${commit.sha.slice(0, 8)}`);

  commits = result.commits.length;
} finally {
  const { preservedWorktreePath } = await sandbox.close();
  if (preservedWorktreePath) {
    worktreePreserved = true;
    console.error(`⚠️  worktree preserved (uncommitted changes): ${preservedWorktreePath}`);
  } else {
    // The round's worktree is left on disk after `close()`, and it is not
    // harmless litter: it is a COPY of this repository, `biome.json` included,
    // and the Biome scanner stops with "found a nested root configuration" —
    // the repository's `pnpm lint` stops running because of it. The script only
    // removes what git no longer tracks; a preserved worktree never gets here.
    execFileSync('node', ['.sandcastle/clean-worktrees.mjs'], { stdio: 'inherit' });
  }
}

if (commits === 0) {
  console.log('no commits — nothing to publish.');
} else if (worktreePreserved) {
  console.error(`✗ ${BRANCH} was not published: its worktree kept uncommitted changes.`);
} else {
  const outcome = publisher.publish(BRANCH, target);
  if (outcome.status === 'published') {
    console.log(
      `✓ ${BRANCH} integrated into ${target} and pushed (${outcome.mergeCommit.slice(0, 8)})`
    );
    git('branch', '-D', BRANCH);
  } else {
    console.error(
      `✗ ${BRANCH} was not published (${outcome.reason}); the branch was kept.\n  ${outcome.detail}`
    );
    process.exitCode = 1;
  }
}
