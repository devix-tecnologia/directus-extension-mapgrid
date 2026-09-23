#!/usr/bin/env node
/**
 * Prova, no fim do setup, que o ambiente entrega o que o prompt promete.
 *
 * Cada verificação aqui existe porque a falha correspondente aparece LONGE da
 * causa se ninguém olhar agora:
 *
 *   * sem `node_modules`, o agente vê "Cannot find module" e tenta consertar o
 *     install — foi assim que uma rodada inteira se perdeu no geohub;
 *   * sem `dist/index.js`, o `docker-compose.test.yml` monta um DIRETÓRIO vazio
 *     no lugar do arquivo (o Docker cria em vez de falhar), o Directus sobe sem
 *     a extensão, e o e2e reprova por um motivo que não é o dele;
 *   * sem Docker alcançável, `pnpm test:e2e` morre no meio da tarefa — e o e2e
 *     é onde as tarefas abertas deste repositório se provam;
 *   * sem o espelho, o Docker existe mas monta caminhos vazios, que é a falha
 *     mais cara de diagnosticar das quatro.
 *
 * Falhar aqui custa o setup. Falhar lá na frente custa a rodada.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const problemas = [];

function arquivoNaoVazio(caminho, explicacao) {
  try {
    const info = statSync(join(raiz, caminho));
    if (info.isDirectory()) {
      problemas.push(`${caminho} é um DIRETÓRIO — ${explicacao}`);
    } else if (info.size === 0) {
      problemas.push(`${caminho} está vazio — ${explicacao}`);
    }
  } catch {
    problemas.push(`${caminho} não existe — ${explicacao}`);
  }
}

function diretorio(caminho, explicacao) {
  try {
    if (!statSync(join(raiz, caminho)).isDirectory()) {
      problemas.push(`${caminho} não é diretório — ${explicacao}`);
    }
  } catch {
    problemas.push(`${caminho} não existe — ${explicacao}`);
  }
}

diretorio('node_modules', 'o install não passou; o agente não pode consertar isso daqui');
arquivoNaoVazio('dist/index.js', 'o build da extensão não saiu, e o e2e monta este arquivo');

try {
  execFileSync('docker', ['info'], { stdio: 'pipe' });
} catch (erro) {
  problemas.push(
    `docker info falhou (${String(erro.message).split('\n')[0]}) — o socket do host não ` +
      'chegou ao container, ou o usuário não está no grupo dele; sem isso não há e2e'
  );
}

try {
  execFileSync('bash', [join(raiz, '.sandcastle', 'no-espelho.sh'), 'true'], { stdio: 'pipe' });
} catch (erro) {
  problemas.push(
    `no-espelho.sh falhou (${String(erro.stderr ?? erro.message).trim().split('\n').pop()}) — ` +
      'o Docker enxergaria caminhos vazios, e a suíte rodaria no nada'
  );
}

if (problemas.length > 0) {
  console.error('✗ ambiente incompleto:');
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}

console.log('✓ ambiente pronto: node_modules, dist/index.js, docker e espelho da worktree');
