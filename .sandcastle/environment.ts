import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { docker } from '@ai-hero/sandcastle/sandboxes/docker';

/**
 * The sandbox environment, in one place.
 *
 * `main.ts` and `round.ts` are two modes of the same agent, and what **must
 * not** diverge between them is the environment: a task that passes in
 * single-iteration mode and fails in round mode because of a mount difference
 * is an hour of diagnosis spent looking in the wrong place.
 */

const DOCKER_SOCKET = '/var/run/docker.sock';

function git(...args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

export const REPO_ROOT = git('rev-parse', '--show-toplevel');

/**
 * Where the Sandcastle creates the worktrees. The path is the one the library
 * uses (`<repo>/.sandcastle/worktrees`), not a choice of ours — it is here
 * because it is what the mirror mount comes from.
 */
export const WORKTREES_DIRECTORY = join(REPO_ROOT, '.sandcastle', 'worktrees');

/**
 * The GID of the host's `docker` group.
 *
 * Read, and not hardcoded, because it varies per machine — here it is 959, on a
 * default Debian install it is 999. Hardcoding it would give a container that
 * comes up fine and only discovers the problem at e2e time, with
 * `permission denied` on the socket.
 */
export function dockerGid(): number {
  const line = execFileSync('getent', ['group', 'docker'], { encoding: 'utf8' }).trim();
  const gid = Number.parseInt(line.split(':')[2] ?? '', 10);
  if (Number.isNaN(gid)) {
    throw new Error(
      `could not read the docker group GID (getent returned "${line}"). ` +
        'Without it the agent cannot reach the socket, and the e2e does not run.'
    );
  }
  return gid;
}

/**
 * The sandbox: this repository's image, the host's Docker socket, and the
 * mirror mount.
 *
 * **The mirror mount is what makes the e2e exist in here.** The agent works in
 * `/home/agent/workspace`, but the daemon it commands is the host's, and every
 * path in `docker-compose.test.yml` is resolved there. Mounting the worktrees
 * directory at the **same absolute path** gives both sides a name they both
 * understand; `on-mirror.sh` is what switches to it.
 *
 * What is mounted is the worktrees DIRECTORY, and not the round's worktree,
 * because its path only exists after the Sandcastle creates it — and the mounts
 * are resolved before that. The `mkdirSync` here is what guarantees the
 * directory exists on the machine's first round: mounting a non-existent path
 * is an error at sandbox creation.
 */
export function sandboxDocker() {
  mkdirSync(WORKTREES_DIRECTORY, { recursive: true });

  return docker({
    mounts: [
      { hostPath: DOCKER_SOCKET, sandboxPath: DOCKER_SOCKET },
      { hostPath: WORKTREES_DIRECTORY, sandboxPath: WORKTREES_DIRECTORY },
    ],
    groups: [dockerGid()],
    env: {
      // The compose subnet is fixed in the file (`10.77.77.0/24`, because of
      // Tailscale — the comment is over there). If the suite runs on the host
      // at the same time as a round, the two fight over the same range. This
      // variable moves the agent's out of the way; the container NAMES still
      // collide, so running both at once is still a bad idea.
      TEST_SUBNET: '10.77.78.0/24',
    },
  });
}

/**
 * The setup, which runs once per sandbox.
 *
 * A single command, chained with `&&`. Two entries in the array do **not**
 * guarantee order, and the symptom of leaving it loose is treacherous: the
 * build finds a half-written `node_modules`, fires an install of its own and
 * dies — pointing at the build when the problem was in the install.
 *
 * `--frozen-lockfile` because the agent has nothing to negotiate with the
 * lockfile: if it does not match `package.json`, that is a failure to report,
 * not to fix on its own.
 *
 * `pnpm build` is not a convenience: `docker-compose.test.yml` mounts
 * `./dist/index.js` INSIDE Directus, and when the file does not exist Docker
 * creates an empty directory in its place instead of failing.
 * `check-environment.mjs` checks the four things the prompt promises before the
 * agent starts.
 *
 * 40 minutes is deliberate slack over what was measured (a full install of this
 * tree is in the minutes, not the tens of minutes). The cost of overrunning is
 * the whole round; the cost of waiting too long is only waiting.
 */
export const SETUP = {
  command:
    'pnpm install --frozen-lockfile && ' +
    'pnpm build && ' +
    'node .sandcastle/check-environment.mjs',
  timeoutMs: 40 * 60_000,
} as const;
