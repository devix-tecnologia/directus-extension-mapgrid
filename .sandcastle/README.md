# Sandcastle no directus-extension-mapgrid

O [Sandcastle](https://github.com/ai-hero-dev/sandcastle) roda um agente dentro
de um container, sobre uma cópia isolada deste repositório. Esta pasta é toda a
configuração.

```sh
pnpm sandcastle:image   # uma vez, e a cada mudança no Dockerfile
pnpm sandcastle         # uma tarefa
pnpm sandcastle:round   # várias tarefas, um setup só (ITERATIONS=3 por padrão)
pnpm sandcastle:queue   # só imprime a fila que o agente vai ler
```

## Antes da primeira rodada: a credencial

O agente dentro do container precisa de um token, e **sem ele a rodada morre
depois do setup, não antes** — você perde o install inteiro para descobrir:

```
Agent started
Not logged in · Please run /login
```

O arquivo é **`.sandcastle/.env`** (não o `.env` da raiz, que o Sandcastle não
lê). Ele está no `.gitignore`. A forma recomendada não guarda o segredo aqui: o
Sandcastle resolve cada chave como `valorDoArquivo || process.env[chave]`, então
o arquivo serve para _declarar_ o que passar, e o valor vem do seu ambiente.

```sh
cp .sandcastle/.env.example .sandcastle/.env
claude setup-token   # gere uma vez; exporte no seu shell ou guarde no keychain
```

## A fila: **menor `Priority` vence**

É a diferença que mais importa em relação à mesma pasta no `geohub`, e copiar de
lá sem trocar isto inverteria a fila.

No taskin, `Priority` é gravada no campo `order` da tarefa: ela é a **posição**
na fila, não o peso dela. O commit `f83f2a6` repriorizou as três tarefas abertas
justamente para a ordem refletir dependência — "010 vai a 10, 007 a 40 e 006 a
700", porque a 007 e a 006 dizem no texto que dependem da 010. Lida do maior
para o menor, a fila entregaria primeiro exatamente a que não pode vir antes.

Por isso também **não há corte de prioridade** aqui: um corte inferior
esconderia o topo da fila. Quem não é do agente vai para `reserved.ts`, com o
motivo escrito por extenso.

`task-queue/` lê `TASKS/*.md` direto, e não o `taskin list`, porque o
`taskin list` **não imprime a prioridade** — ele ordena por ID. O teste
`task-queue.test.ts` amarra a ordem que o código aplica à ordem que o
`prompt.md` descreve, para os dois não divergirem; ele roda no `pnpm test`.

## O e2e roda aqui dentro, e é o que muda o que o agente consegue provar

As tarefas abertas mexem em como a extensão compõe os layouts de um Directus de
verdade. Isso não se prova no unitário. Por isso o sandbox recebe o **socket do
Docker do host** (`--group-add <gid do grupo docker>`), e `pnpm test:e2e` roda
de dentro.

O que isso exige, e é a parte não óbvia:

> **O daemon é o do host. Todo caminho do `docker-compose.test.yml` (`./`,
> `./dist/index.js`) é resolvido no host, onde `/home/agent/workspace` não
> existe — e o Docker, nesse caso, CRIA o diretório vazio em vez de falhar.**

O Directus sobe sem a extensão, o runner monta um `/workspace` vazio, e a suíte
reprova por um motivo que não é o dela, longe da causa. A saída é a **paridade
de caminho**: o `environment.ts` monta `<repo>/.sandcastle/worktrees` no container
no mesmo caminho absoluto, e o `on-mirror.sh` troca para ele antes de chamar o
compose — conferindo, pelo inode do `package.json`, que é a mesma árvore e não
um diretório de mesmo nome.

```sh
.sandcastle/on-mirror.sh pnpm test:e2e
```

**Não rode a suíte no host enquanto uma rodada estiver de pé.** A sub-rede do
agente é separada (`TEST_SUBNET=10.77.78.0/24`), mas os nomes dos contêineres
vêm do `TEST_SUITE_ID`, que o `tests/run-docker-tests.js` fixa — as duas
execuções disputariam os mesmos nomes.

## O que a imagem tem, e por quê

| ferramenta                    | por quê                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| Node 22                       | `.tool-versions` fixa 22.13.1 e o `engines` pede `>=22.13.1`                 |
| `pnpm@10.15.0` pelo npm       | corepack sem `packageManager` baixa a mais nova, e a 12 recusa o lockfile     |
| `docker-ce-cli` + compose     | falam com o socket do host; é o que dá e2e, integração e screenshot ao agente |
| `HUSKY=0`                     | o `prepare` do pacote instala hooks que aqui só podem atrapalhar              |
| grupo `docker-host`           | o GID do socket do host, lido com `getent` na hora do build                   |

O `storeDir` do pnpm fica fora da montagem (é cache de máquina), mas o
**`virtualStoreDir` fica no padrão de propósito**: o `node_modules/.pnpm`
precisa estar dentro da árvore, porque o espelho que o Docker enxerga é a mesma
árvore — mover os arquivos para fora do bind mount os tiraria do alcance do
host.

## A worktree que sobra quebra o `pnpm lint` do repositório

Medido na primeira rodada, em 2026-09-23. O que fica em
`.sandcastle/worktrees/<rodada>/` é uma **cópia deste repositório**,
`biome.json` inclusive — e o scanner do Biome acha a cópia antes de olhar
qualquer configuração:

```
× Found a nested root configuration, but there's already a root configuration.
```

O lint da raiz então não roda. Não há configuração que desarme isso: negação em
`files.includes`, `files.experimentalScannerIgnores` e `vcs.useIgnoreFile` foram
os três tentados, e o erro vem antes dos três. A saída é o diretório não
existir:

```sh
pnpm sandcastle:clean    # remove só o que o git já não registra
```

O `round.ts` chama isso sozinho ao terminar, **exceto** quando o Sandcastle
preservou a worktree por ter trabalho não commitado — aí ela fica, e o lint
quebrado é o preço de não perder o trabalho.

**Enquanto a rodada está de pé, o `pnpm lint` do host falha assim e está
certo**: a worktree é o workspace do agente. O lint que importa nessa hora é o
de dentro do container, que não enxerga esta pasta.

Uma nota de herança: o runner do e2e sobe como root e escreve no workspace
montado, então `playwright-report/` e `test-results/` saem com dono root — no
repositório também, quando a suíte roda no host. É por isso que a limpeza tem
um caminho pelo `docker run --rm alpine rm -rf` em vez de pedir `sudo`.

## O que cobre esta pasta

```sh
pnpm test                  # inclui task-queue/*.test.ts
pnpm typecheck:sandcastle  # strict + noUncheckedIndexedAccess
```

O `biome.json` **não alcança** esta pasta: o `files.includes` dele lista
`src/`, `tests/`, `.storybook/` e os `*.ts` da raiz. Está escrito aqui para
ninguém ler o silêncio do lint como aprovação.

⚠️ O glob do vitest para cá é `.sandcastle/task-queue/*.test.ts` — um
nível, de propósito. Com `**` ele desce em `.sandcastle/worktrees/<rodada>/` e
coleta o repositório inteiro de novo. Vale para qualquer ferramenta que varra
por padrão, e reaparece toda vez que alguém acrescenta uma.
