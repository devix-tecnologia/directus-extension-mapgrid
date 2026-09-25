import { claudeCode, run } from '@ai-hero/sandcastle';

import { SETUP, sandboxDocker } from './environment.ts';

/**
 * Sandcastle on directus-extension-mapgrid: ONE task.
 *
 * The whole environment — image, Docker socket, mirror mount, setup — is in
 * `environment.ts`, shared with `round.ts`.
 *
 * Run with: pnpm sandcastle
 */
await run({
  name: 'worker',

  sandbox: sandboxDocker(),

  agent: claudeCode('claude-opus-5'),

  promptFile: './.sandcastle/prompt.md',

  maxIterations: 1,

  // `merge-to-head` merges into whatever HEAD is, and **switches the working
  // directory's branch** when it finishes. Always run from a working branch,
  // never from `develop` directly.
  branchStrategy: { type: 'merge-to-head' },

  // No `copyToWorktree: ['node_modules']`, despite what the template suggests:
  // pnpm's node_modules is almost all symlinks into the host store, and copying
  // that produces dangling links inside the container.

  hooks: { sandbox: { onSandboxReady: [SETUP] } },
});
