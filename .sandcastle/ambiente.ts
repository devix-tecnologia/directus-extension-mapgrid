import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { docker } from '@ai-hero/sandcastle/sandboxes/docker';

/**
 * O ambiente do sandbox, num lugar só.
 *
 * O `main.ts` e o `rodada.ts` são dois modos do mesmo agente, e o que **não**
 * pode divergir entre eles é o ambiente: uma tarefa que passa no modo de uma
 * iteração e falha no modo rodada, por diferença de montagem, é uma hora de
 * diagnóstico procurando no lugar errado.
 */

const SOCKET_DO_DOCKER = '/var/run/docker.sock';

function git(...args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

export const RAIZ_DO_REPO = git('rev-parse', '--show-toplevel');

/**
 * Onde o Sandcastle cria as worktrees. O caminho é o que a biblioteca usa
 * (`<repo>/.sandcastle/worktrees`), e não uma escolha nossa — está aqui porque
 * é dele que sai a montagem espelho.
 */
export const DIRETORIO_DE_WORKTREES = join(RAIZ_DO_REPO, '.sandcastle', 'worktrees');

/**
 * O GID do grupo `docker` do host.
 *
 * Lido, e não fixado, porque ele varia por máquina — aqui é 959, numa instalação
 * padrão do Debian é 999. Fixar daria um container que sobe normalmente e só
 * descobre o problema na hora do e2e, com `permission denied` no socket.
 */
export function gidDoDocker(): number {
  const linha = execFileSync('getent', ['group', 'docker'], { encoding: 'utf8' }).trim();
  const gid = Number.parseInt(linha.split(':')[2] ?? '', 10);
  if (Number.isNaN(gid)) {
    throw new Error(
      `não consegui ler o GID do grupo docker (getent devolveu "${linha}"). ` +
        'Sem ele o agente não alcança o socket, e o e2e não roda.'
    );
  }
  return gid;
}

/**
 * O sandbox: a imagem deste repositório, o socket do Docker do host, e a
 * montagem espelho.
 *
 * **A montagem espelho é o que faz o e2e existir aqui dentro.** O agente
 * trabalha em `/home/agent/workspace`, mas o daemon que ele comanda é o do
 * host, e todo caminho do `docker-compose.test.yml` é resolvido lá. Montar o
 * diretório de worktrees no **mesmo caminho absoluto** dá aos dois lados um
 * nome que ambos entendem; o `no-espelho.sh` é quem troca para ele.
 *
 * Monta-se o DIRETÓRIO de worktrees, e não a worktree da rodada, porque o
 * caminho dela só existe depois que o Sandcastle a cria — e as montagens são
 * resolvidas antes. O `mkdirSync` aqui é o que garante que o diretório exista
 * na primeira rodada da máquina: montagem de caminho inexistente é erro na
 * criação do sandbox.
 */
export function sandboxDocker() {
  mkdirSync(DIRETORIO_DE_WORKTREES, { recursive: true });

  return docker({
    mounts: [
      { hostPath: SOCKET_DO_DOCKER, sandboxPath: SOCKET_DO_DOCKER },
      { hostPath: DIRETORIO_DE_WORKTREES, sandboxPath: DIRETORIO_DE_WORKTREES },
    ],
    groups: [gidDoDocker()],
    env: {
      // A sub-rede do compose é fixa no arquivo (`10.77.77.0/24`, por causa do
      // Tailscale — o comentário está lá). Se a suíte rodar no host ao mesmo
      // tempo que a rodada, as duas disputam a mesma faixa. Esta variável tira
      // a do agente de perto; os NOMES dos contêineres ainda colidem, então
      // rodar as duas ao mesmo tempo continua sendo má ideia.
      TEST_SUBNET: '10.77.78.0/24',
    },
  });
}

/**
 * O setup, que roda uma vez por sandbox.
 *
 * Um comando só, encadeado com `&&`. Duas entradas no array **não** garantem
 * ordem, e o sintoma de deixar solto é traiçoeiro: o build encontra o
 * `node_modules` pela metade, dispara um install próprio e morre — apontando
 * para o build quando o problema estava no install.
 *
 * `--frozen-lockfile` porque o agente não tem o que negociar com o lockfile: se
 * ele não bate com o `package.json`, isso é uma falha a relatar, não a
 * consertar sozinho.
 *
 * O `pnpm build` não é conveniência: o `docker-compose.test.yml` monta
 * `./dist/index.js` DENTRO do Directus, e quando o arquivo não existe o Docker
 * cria um diretório vazio no lugar em vez de falhar. O `verifica-ambiente.mjs`
 * confere as quatro coisas que o prompt promete antes de o agente começar.
 *
 * 40 minutos é folga deliberada sobre o medido (o install completo desta árvore
 * fica na casa dos minutos, não das dezenas). O custo de estourar é a rodada
 * inteira; o de esperar demais é só esperar.
 */
export const SETUP = {
  command:
    'pnpm install --frozen-lockfile && ' +
    'pnpm build && ' +
    'node .sandcastle/verifica-ambiente.mjs',
  timeoutMs: 40 * 60_000,
} as const;
