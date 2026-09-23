# Sandcastle no directus-extension-mapgrid

O [Sandcastle](https://github.com/ai-hero-dev/sandcastle) roda um agente dentro
de um container, sobre uma cópia isolada deste repositório. Esta pasta é toda a
configuração.

```sh
pnpm sandcastle:image   # uma vez, e a cada mudança no Dockerfile
pnpm sandcastle         # uma tarefa
pnpm sandcastle:rodada  # várias tarefas, um setup só (ITERACOES=3 por padrão)
pnpm sandcastle:fila    # só imprime a fila que o agente vai ler
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
esconderia o topo da fila. Quem não é do agente vai para `reservadas.ts`, com o
motivo escrito por extenso.

`fila-de-tarefas/` lê `TASKS/*.md` direto, e não o `taskin list`, porque o
`taskin list` **não imprime a prioridade** — ele ordena por ID. O teste
`fila-de-tarefas.test.ts` amarra a ordem que o código aplica à ordem que o
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
de caminho**: o `ambiente.ts` monta `<repo>/.sandcastle/worktrees` no container
no mesmo caminho absoluto, e o `no-espelho.sh` troca para ele antes de chamar o
compose — conferindo, pelo inode do `package.json`, que é a mesma árvore e não
um diretório de mesmo nome.

```sh
.sandcastle/no-espelho.sh pnpm test:e2e
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

## O que cobre esta pasta

```sh
pnpm test                  # inclui fila-de-tarefas/*.test.ts
pnpm typecheck:sandcastle  # strict + noUncheckedIndexedAccess
```

O `biome.json` **não alcança** esta pasta: o `files.includes` dele lista
`src/`, `tests/`, `.storybook/` e os `*.ts` da raiz. Está escrito aqui para
ninguém ler o silêncio do lint como aprovação.

⚠️ O glob do vitest para cá é `.sandcastle/fila-de-tarefas/*.test.ts` — um
nível, de propósito. Com `**` ele desce em `.sandcastle/worktrees/<rodada>/` e
coleta o repositório inteiro de novo. Vale para qualquer ferramenta que varra
por padrão, e reaparece toda vez que alguém acrescenta uma.
