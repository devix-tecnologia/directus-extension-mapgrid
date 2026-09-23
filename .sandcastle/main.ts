import { claudeCode, run } from '@ai-hero/sandcastle';

import { SETUP, sandboxDocker } from './ambiente.ts';

/**
 * Sandcastle no directus-extension-mapgrid: UMA tarefa.
 *
 * O ambiente inteiro — imagem, socket do Docker, montagem espelho, setup — está
 * em `ambiente.ts`, compartilhado com o `rodada.ts`.
 *
 * Rodar com: pnpm sandcastle
 */
await run({
  name: 'worker',

  sandbox: sandboxDocker(),

  agent: claudeCode('claude-opus-5'),

  promptFile: './.sandcastle/prompt.md',

  maxIterations: 1,

  // `merge-to-head` mescla no HEAD que estiver, e **troca a branch do diretório
  // de trabalho** ao terminar. Rodar sempre a partir de uma branch de trabalho,
  // nunca do `develop` direto.
  branchStrategy: { type: 'merge-to-head' },

  // Sem `copyToWorktree: ['node_modules']`, apesar de o template sugerir: o
  // node_modules do pnpm é quase todo symlink para o store do host, e copiar
  // isso produz links pendurados dentro do container.

  hooks: { sandbox: { onSandboxReady: [SETUP] } },
});
