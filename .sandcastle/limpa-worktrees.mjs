#!/usr/bin/env node
/**
 * Remove as worktrees de rodadas passadas que o git já não registra.
 *
 * Por que isto não é faxina cosmética: o que sobra ali é uma **cópia deste
 * repositório**, `biome.json` inclusive, e o scanner do Biome acha a cópia
 * antes de olhar qualquer `includes`. O `pnpm lint` então para com
 *
 *     × Found a nested root configuration, but there's already a root
 *       configuration.
 *
 * e deixa de rodar por causa de um diretório que nem é do projeto. Medido em
 * 2026-09-23, com a primeira worktree que sobrou depois de uma rodada; e não há
 * configuração do Biome que desarme isso — `files.includes` com negação,
 * `experimentalScannerIgnores` e `vcs.useIgnoreFile` foram os três tentados, e
 * o erro vem antes dos três. A saída é o diretório não existir.
 *
 * (Enquanto uma rodada está DE PÉ, o `pnpm lint` do host falha assim e está
 * certo: a worktree é o workspace do agente e tem de existir. Espere a rodada
 * terminar; o lint de dentro do container não vê esta pasta.)
 *
 * Só remove o que o git não registra mais. Worktree viva — ou preservada porque
 * tinha trabalho não commitado — não é tocada: perder trabalho de agente sai
 * muito mais caro que um lint quebrado.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const raiz = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim();
const diretorio = join(raiz, '.sandcastle', 'worktrees');

const registradas = new Set(
  execFileSync('git', ['worktree', 'list', '--porcelain'], { encoding: 'utf8' })
    .split('\n')
    .filter((linha) => linha.startsWith('worktree '))
    .map((linha) => linha.slice('worktree '.length))
);

let entradas;
try {
  entradas = readdirSync(diretorio, { withFileTypes: true });
} catch {
  console.log('nada a limpar: não há .sandcastle/worktrees');
  process.exit(0);
}

let removidas = 0;
for (const entrada of entradas) {
  if (!entrada.isDirectory()) continue;
  const caminho = join(diretorio, entrada.name);
  if (registradas.has(caminho)) {
    console.log(`mantida (o git ainda a registra): ${entrada.name}`);
    continue;
  }
  try {
    rmSync(caminho, { recursive: true, force: true });
  } catch (erro) {
    if (erro.code !== 'EACCES' && erro.code !== 'EPERM') throw erro;
    // O runner do e2e sobe como root e escreve no workspace montado —
    // `playwright-report/` e `test-results/` saem com dono root, tanto aqui
    // quanto no repositório quando a suíte roda no host. Apagar isso pediria
    // sudo; em vez disso pedimos ao mesmo Docker que os criou, que é quem já
    // tem o privilégio. Nenhum segredo entra no container: só o diretório.
    console.log(`  ${entrada.name}: sobrou arquivo de dono root (${erro.code}); removendo via docker`);
    execFileSync(
      'docker',
      ['run', '--rm', '-v', `${diretorio}:/alvo`, 'alpine:3', 'rm', '-rf', `/alvo/${entrada.name}`],
      { stdio: 'inherit' }
    );
  }
  console.log(`removida: ${entrada.name}`);
  removidas += 1;
}

console.log(removidas === 0 ? 'nada órfão a remover.' : `${removidas} worktree(s) órfã(s) removida(s).`);
