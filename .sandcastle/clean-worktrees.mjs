#!/usr/bin/env node
/**
 * Removes worktrees from past rounds that git no longer tracks.
 *
 * Why this is not cosmetic housekeeping: what is left there is a **copy of this
 * repository**, `biome.json` included, and the Biome scanner finds the copy
 * before looking at any `includes`. `pnpm lint` then stops with
 *
 *     × Found a nested root configuration, but there's already a root
 *       configuration.
 *
 * and stops running because of a directory that is not even part of the
 * project. Measured on 2026-09-23, with the first worktree left over after a
 * round; and there is no Biome configuration that disarms it — `files.includes`
 * with a negation, `experimentalScannerIgnores` and `vcs.useIgnoreFile` were
 * the three that were tried, and the error comes before all three. The way out
 * is for the directory not to exist.
 *
 * (While a round is UP, the host's `pnpm lint` fails this way and that is
 * correct: the worktree is the agent's workspace and has to exist. Wait for the
 * round to finish; the lint inside the container does not see this folder.)
 *
 * It only removes what git no longer tracks. A live worktree — or one preserved
 * because it had uncommitted work — is left alone: losing agent work costs far
 * more than a broken lint.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();
const directory = join(root, '.sandcastle', 'worktrees');

const tracked = new Set(
  execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' })
    .split('\n')
    .filter((line) => line.startsWith('worktree '))
    .map((line) => line.slice('worktree '.length))
);

let entries;
try {
  entries = readdirSync(directory, { withFileTypes: true });
} catch {
  console.log('nothing to clean: there is no .sandcastle/worktrees');
  process.exit(0);
}

let removed = 0;
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const path = join(directory, entry.name);
  if (tracked.has(path)) {
    console.log(`kept (git still tracks it): ${entry.name}`);
    continue;
  }
  try {
    rmSync(path, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== 'EACCES' && error.code !== 'EPERM') throw error;
    // The e2e runner comes up as root and writes into the mounted workspace —
    // `playwright-report/` and `test-results/` end up owned by root, both here
    // and in the repository when the suite runs on the host. Deleting that
    // would ask for sudo; instead we ask the same Docker that created them,
    // which already has the privilege. No secret enters the container: only the
    // directory.
    console.log(`  ${entry.name}: root-owned files left over (${error.code}); removing via docker`);
    execFileSync(
      'docker',
      [
        'run',
        '--rm',
        '-v',
        `${directory}:/target`,
        'alpine:3',
        'rm',
        '-rf',
        `/target/${entry.name}`,
      ],
      { stdio: 'inherit' }
    );
  }
  console.log(`removed: ${entry.name}`);
  removed += 1;
}

console.log(
  removed === 0 ? 'nothing orphaned to remove.' : `${removed} orphaned worktree(s) removed.`
);
