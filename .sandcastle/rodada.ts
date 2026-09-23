import { execFileSync } from 'node:child_process';

import { claudeCode, createSandbox } from '@ai-hero/sandcastle';

import { SETUP, sandboxDocker } from './ambiente.ts';

/**
 * Modo rodada: UM setup, várias tarefas.
 *
 * Por que existe: o `run()` do `main.ts` recria o sandbox a cada iteração, e
 * cada recriação paga o install e o build de novo. Três tarefas pagariam o
 * setup três vezes.
 *
 * `createSandbox()` devolve um handle cujo `run()` invoca o agente **dentro do
 * sandbox existente**. O setup roda uma vez e fica fora do laço.
 *
 * O preço: `createSandbox` exige `branch` explícita e não aceita
 * `branchStrategy`, então o merge de volta é por nossa conta — `close()` só
 * derruba o sandbox, não integra nada. É o que a `integrar` abaixo faz, e ela
 * **preserva a branch** quando falha, em vez de perder o trabalho.
 *
 * Rodar com: pnpm sandcastle:rodada
 */

/**
 * Quantas tarefas o agente fecha nesta rodada.
 *
 * Três é o padrão porque é o número de tarefas abertas hoje (010, 007, 006) e
 * elas estão na fila na ordem em que dependem umas das outras. `ITERACOES=1`
 * serve para mandar só a primeira e recuperar a máquina.
 */
const ITERACOES = Number(process.env.ITERACOES ?? 3);
if (!Number.isInteger(ITERACOES) || ITERACOES < 1) {
  throw new Error(`ITERACOES precisa ser inteiro >= 1; veio ${process.env.ITERACOES}`);
}

const BRANCH = `sandcastle/rodada-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

function git(...args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

/**
 * Integra a branch da rodada no HEAD atual.
 *
 * Não usa `--no-verify` nem força nada: se o merge falhar, a branch fica de pé e
 * o caminho de recuperação sai impresso. Perder trabalho de agente por um merge
 * automático mal resolvido já aconteceu nesta configuração.
 */
function integrar(branch: string, alvo: string): boolean {
  try {
    git('merge', '--no-ff', '-m', `chore: integra ${branch} em ${alvo}`, branch);
    console.log(`✓ ${branch} integrada em ${alvo}`);
    return true;
  } catch {
    console.error(
      `✗ merge de ${branch} em ${alvo} falhou.\n` +
        '  A branch foi PRESERVADA. Para retomar:\n' +
        `    git merge ${branch}\n` +
        '  E depois, se estiver tudo certo:\n' +
        `    git branch -D ${branch}`
    );
    return false;
  }
}

const alvo = git('rev-parse', '--abbrev-ref', 'HEAD');
console.log(`rodada: branch ${BRANCH}, alvo ${alvo}, ${ITERACOES} iteração(ões)`);

const sandbox = await createSandbox({
  branch: BRANCH,
  sandbox: sandboxDocker(),
  hooks: { sandbox: { onSandboxReady: [SETUP] } },
});

let mesclou = false;
try {
  const resultado = await sandbox.run({
    agent: claudeCode('claude-opus-5'),
    promptFile: './.sandcastle/prompt.md',
    maxIterations: ITERACOES,
  });

  console.log(
    `\nrodada: ${resultado.iterations.length} iteração(ões), ` +
      `${resultado.commits.length} commit(s)`
  );
  for (const c of resultado.commits) console.log(`  ${c.sha.slice(0, 8)}`);

  if (resultado.commits.length === 0) {
    console.log('nenhum commit — nada a integrar.');
  } else {
    mesclou = integrar(BRANCH, alvo);
  }
} finally {
  const { preservedWorktreePath } = await sandbox.close();
  if (preservedWorktreePath) {
    console.error(`⚠️  worktree preservada (mudanças não commitadas): ${preservedWorktreePath}`);
  }
}

// A remoção da branch vem DEPOIS do `close()`, e a ordem não é estética: o
// worktree ainda usa a branch enquanto o sandbox está de pé, e o git recusa com
// `cannot delete branch ... used by worktree`.
if (mesclou) {
  try {
    git('branch', '-D', BRANCH);
  } catch {
    console.error(`⚠️  não removi ${BRANCH}; ela já foi mesclada, remova quando quiser.`);
  }
}
