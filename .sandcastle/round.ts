import { execFileSync } from 'node:child_process';

import { claudeCode, createSandbox } from '@ai-hero/sandcastle';

import { SETUP, sandboxDocker } from './environment.ts';

/**
 * Round mode: ONE setup, several tasks.
 *
 * Why it exists: `run()` in `main.ts` recreates the sandbox on every iteration,
 * and every recreation pays for the install and the build again. Three tasks
 * would pay for the setup three times.
 *
 * `createSandbox()` returns a handle whose `run()` invokes the agent **inside
 * the existing sandbox**. The setup runs once and stays out of the loop.
 *
 * The price: `createSandbox` requires an explicit `branch` and does not take a
 * `branchStrategy`, so merging back is on us — `close()` only tears the sandbox
 * down, it integrates nothing. That is what `integrate` below does, and it
 * **preserves the branch** when it fails, instead of losing the work.
 *
 * Run with: pnpm sandcastle:round
 */

/**
 * How many tasks the agent closes in this round.
 *
 * Three is the default because it is the number of tasks open today (010, 007,
 * 006) and they sit in the queue in the order in which they depend on one
 * another. `ITERATIONS=1` is there to send only the first one and get the
 * machine back.
 */
const ITERATIONS = Number(process.env.ITERATIONS ?? 3);
if (!Number.isInteger(ITERATIONS) || ITERATIONS < 1) {
  throw new Error(`ITERATIONS must be an integer >= 1; it came as ${process.env.ITERATIONS}`);
}

const BRANCH = `sandcastle/round-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

function git(...args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

/**
 * Integrates the round's branch into the current HEAD.
 *
 * It uses neither `--no-verify` nor force: if the merge fails, the branch stays
 * up and the recovery path is printed. Losing agent work to a badly resolved
 * automatic merge has already happened in this setup.
 */
function integrate(branch: string, target: string): boolean {
  try {
    git('merge', '--no-ff', '-m', `chore: integra ${branch} em ${target}`, branch);
    console.log(`✓ ${branch} integrated into ${target}`);
    return true;
  } catch {
    console.error(
      `✗ merging ${branch} into ${target} failed.\n` +
        '  The branch was PRESERVED. To resume:\n' +
        `    git merge ${branch}\n` +
        '  And afterwards, if everything is fine:\n' +
        `    git branch -D ${branch}`
    );
    return false;
  }
}

const target = git('rev-parse', '--abbrev-ref', 'HEAD');
console.log(`round: branch ${BRANCH}, target ${target}, ${ITERATIONS} iteration(s)`);

const sandbox = await createSandbox({
  branch: BRANCH,
  sandbox: sandboxDocker(),
  hooks: { sandbox: { onSandboxReady: [SETUP] } },
});

let merged = false;
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

  if (result.commits.length === 0) {
    console.log('no commits — nothing to integrate.');
  } else {
    merged = integrate(BRANCH, target);
  }
} finally {
  const { preservedWorktreePath } = await sandbox.close();
  if (preservedWorktreePath) {
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

// Deleting the branch comes AFTER `close()`, and the order is not cosmetic: the
// worktree still uses the branch while the sandbox is up, and git refuses with
// `cannot delete branch ... used by worktree`.
if (merged) {
  try {
    git('branch', '-D', BRANCH);
  } catch {
    console.error(`⚠️  did not remove ${BRANCH}; it is already merged, remove it when you like.`);
  }
}
