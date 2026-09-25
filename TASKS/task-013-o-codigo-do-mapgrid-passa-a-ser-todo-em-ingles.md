# 🧩 Task 013 — O código do MapGrid passa a ser todo em inglês

- Status: in-review
- Type: refactor
- Assignee: sidartaveloso
- Priority: 660

## Description

O MapGrid é pacote público e o código dele é em inglês — regra no `CLAUDE.md`
da raiz (decidido por Sidarta em 2026-09-24). Parte do que as tasks 007, 010 e
012 escreveram saiu em português, seguindo o hábito do geohub. Esta task passa
tudo para inglês, sem mudar comportamento: é renomeação, e os testes (unitários
e e2e) são a rede.

Continuam em português: `TASKS/`, mensagens de commit e os textos de interface,
que já vão pelo `src/shared/messages.ts`.

## Inventário (medido em 2026-09-24)

- `src/services/centralizador-de-mapa/` — `CentralizadorDoMapaDirectus`,
  `ICentralizadorDeMapa`, `AgendaDoCentralizador`, `FonteDaColecao`,
  `OpcoesDeCentralizacao`, `TamanhoDaTela`, `Retangulo` e os métodos
  (`centralizar`, `centralizarItem`, `enquadrarTudo`, `aoMoverACamera`)
- `src/services/embedded-layout/` — `embutirLayout`, `OpcoesDeEmbutir`,
  `RegistroDeLayouts`, `LayoutEmbutido`, `CONTRATO_DOS_EMBUTIDOS`,
  `leitor-de-estado.ts` (`leitorDeEstadoEmbutido`)
- `src/components/templates/mapgrid-layout/` — `enquadrarItem`,
  `selecionarItem`, `propsDoMapa`, `propsDaGrade` e demais nomes internos
- `tests/` — helpers do e2e (`linhaDe`, `abrirOpcoesDoLayout`,
  `clicarNoPontoCentral`, `garantirColecaoDeTrajetos`…), as specs de
  `tests/screenshot/` e todos os títulos de `describe`/`it`
- `.sandcastle/` — `fila-de-tarefas/`, `credencial/`, `rodada.ts`,
  `rodada-autenticada.ts`, `ambiente.ts` e os demais
- `scripts/captura-de-tela/` (`nomeDeEvidencia`). O
  `scripts/tamanho-de-evidencia/` sai quando o taskin com teto de anexo for
  adotado; não renomear
- comentários e TSDoc em português, em todo o `src/`

## Da revisão da task-012

Entram aqui porque mexem nos mesmos arquivos:

- `leitorDeEstadoEmbutido` é função solta: vira classe com interface, na pasta
  própria
- os comentários narrativos de `leitor-de-estado.ts`, `MapgridLayout.vue` e
  `vitest.vue-do-directus.config.ts` viram TSDoc curto no contrato; a história
  está na task-012
- sai o `try/catch` com "último valor bom": não resolve o defeito da task-012 e
  entrega valor velho em silêncio quando outra chave explodir. Fica a exclusão
  pelo nome

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Renomear `src/`, com os testes passando a cada passo
- [x] Renomear `tests/` e os títulos de teste
- [x] Renomear `.sandcastle/` e `scripts/captura-de-tela/`
- [x] Os três ajustes da revisão da task-012
- [x] Nenhum identificador nem comentário em português sobrando no código
      (conferido por busca; o que ficou de fora está em `## Notes`)
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:sandcastle`, `pnpm test`
      e `pnpm test:e2e` verdes
- [ ] ... — adiado: `pnpm test:integration` não roda de dentro do sandbox, por
      limitação de ambiente que não é desta task (detalhe em `## Notes`)

## Notes

### O que foi renomeado

Três commits, um por área, cada um com os gates verdes antes de fechar:

| de                                    | para                                  |
| ------------------------------------- | ------------------------------------- |
| `src/services/centralizador-de-mapa/` | `src/services/map-centerer/`          |
| `src/services/embedded-layout/leitor-de-estado.ts` | `src/services/embedded-state-reader/` |
| `scripts/captura-de-tela/`            | `scripts/screenshot/`                 |
| `tests/e2e/mapgrid-contrato.spec.ts`  | `mapgrid-contract.spec.ts`            |
| `tests/e2e/mapgrid-trajetos.spec.ts`  | `mapgrid-routes.spec.ts`              |
| `tests/helpers/basemap-do-projeto.ts` | `project-basemap.ts`                  |
| `tests/helpers/colecao-de-trajetos.ts`| `route-collection.ts`                 |
| `tests/screenshot/evidencia-*.spec.ts`| `evidence-*.spec.ts`                  |
| `tests/screenshot/helpers/tira-de-quadros.ts` | `frame-strip.ts`              |
| `.sandcastle/ambiente.ts`             | `environment.ts`                      |
| `.sandcastle/rodada.ts`               | `round.ts`                            |
| `.sandcastle/rodada-autenticada.ts`   | `authenticated-round.ts`              |
| `.sandcastle/limpa-worktrees.mjs`     | `clean-worktrees.mjs`                 |
| `.sandcastle/verifica-ambiente.mjs`   | `check-environment.mjs`               |
| `.sandcastle/no-espelho.sh`           | `on-mirror.sh`                        |
| `.sandcastle/credencial/`             | `credential/`                         |
| `.sandcastle/fila-de-tarefas/`        | `task-queue/`                         |

Os scripts do `package.json` acompanharam os caminhos: `sandcastle:rodada` →
`sandcastle:round`, `sandcastle:fila` → `sandcastle:queue`, `sandcastle:limpar`
→ `sandcastle:clean`, `sandcastle:rodada:autenticada` →
`sandcastle:round:authenticated`; `ITERACOES` → `ITERATIONS` e `--novo` →
`--new`. O `.sandcastle/prompt.md`, o `.sandcastle/README.md` e o
`vitest.config.ts` foram atualizados no mesmo commit — nada ficou pendurado.

### Os três ajustes da revisão da task-012

1. `leitorDeEstadoEmbutido` virou `EmbeddedStateReader implements
   IEmbeddedStateReader`, em `src/services/embedded-state-reader/`.
2. Saiu o `try/catch` com "último valor bom". Ele não resolvia o defeito da
   task-012 — a explosão que congelava a tela acontece **fora** da nossa
   leitura, no agendador do Vue — e entregava valor velho em silêncio quando
   outra chave explodisse. Fica só a exclusão pelo nome. O teste que fixava o
   valor velho foi substituído por um que **exige** o throw.
3. Os comentários narrativos de `MapgridLayout.vue` e
   `vitest.vue-do-directus.config.ts` encolheram para TSDoc curto.

### O que ficou em português, e por quê

- **`src/shared/messages.ts`** (pt-BR) — é texto de interface, e é o lugar dele.
- **O texto que a fila renderiza** (`task-queue.ts`) — ele é lido dentro do
  `prompt.md`, que é documento e fica em português como o `TASKS/`. O teste
  `task-queue.test.ts` compara contra esse texto, então as duas asserções de
  regex também ficaram em português.
- **As expressões bilíngues dos seletores de e2e**
  (`/zoom when clicking|aproximar ao clicar/i`) — o app do Directus muda de
  idioma, e o spec tem de casar nos dois.
- **`EVIDENCE_MOMENT=antes|depois`** e o sufixo `-antes`/`-depois` no nome do
  arquivo de evidência. Esses valores estão no prompt da rodada, nos docs das
  tasks e nos PNG **já versionados** em `TASKS/assets/`. Traduzi-los renomearia
  evidência existente e quebraria o comando documentado. O tipo
  `EvidenceMoment` diz isso em TSDoc, para o próximo não achar que passou
  batido.
- **`scripts/tamanho-de-evidencia/`** — a própria task manda não renomear: ele
  sai quando o taskin com teto de anexo for adotado.
- **O alias `vue-do-directus`** (`package.json`,
  `vitest.vue-do-directus.config.ts`, o sufixo `*.vue-do-directus.test.ts`).
  Trocar o nome do alias exige `pnpm install` para refazer o link no
  `node_modules`, e o ambiente do sandbox proíbe rodar install. **É o único item
  desta lista que vale a pena fazer numa rodada futura**, fora do sandbox.
- **`docs/tela.jpg`** e `test-results/video-evidencia` — caminhos citados no
  README e em docs; renomeá-los é mudança de documentação, não de código.
- **O prefixo de branch `sandcastle/rodada-`** — combina com a mensagem de
  merge, que é commit e portanto português.

### Descobertas do caminho

**O `biome check --write --unsafe` reescreve `fit(` para `it(` em arquivo que
não é de teste.** A regra `noFocusedTests` trata `fit(` como teste focado do
jasmine. Uma função local chamada `fit` dentro de `map-centerer.ts` virou `it`,
a declaração virou `_fit` por ficar sem uso, e dois testes reprovaram com
"Calling the test function inside another test function is not allowed" —
apontando para o arquivo de teste, longe da causa. O nome local virou `frame`.
**Não usar `fit`, `fdescribe` nem `xit` como nome de símbolo neste repo.**

**A mensagem do contrato mudou de texto**, não só de constante:
`'[mapgrid] contrato quebrado'` → `'[mapgrid] broken contract'`. É mensagem de
log, que o `CLAUDE.md` quer em inglês; o e2e compara pela constante
`CONTRACT_MARKER`, então acompanhou sozinho — e o controle negativo do
`mapgrid-contract.spec.ts` provou que a escuta continua enxergando a marca.

**A coleção de e2e com geometria nativa mudou de nome** junto com o helper:
`test_mapgrid_trajetos`/campo `trajeto` → `test_mapgrid_routes`/campo `route`.
É seguro porque o banco da pilha de teste é `tmpfs` (ver
`docker-compose.test.yml`): sobe vazio a cada execução, então não há coleção
velha sobrando.

### Evidência de tela

**Esta task não muda nada renderizado**, e por isso não traz par antes/depois:
duas capturas byte-idênticas não seriam evidência, seriam a mesma tela
fotografada duas vezes — que é o que o próprio processo proíbe.

O que mudou perto da tela foram dois nomes de classe CSS em
`MapgridOptions.vue` (`.mapgrid-option__campos` → `.mapgrid-option__fields`,
`.sem-painel` → `.no-panel`), com os mesmos estilos. Quem prova que eles não
quebraram é o e2e, não uma imagem: o teste "as seções do painel de opções ocupam
a largura do painel" mede a razão entre a largura de um `.field` de dentro da
seção e a do painel, e essa razão depende do `display: grid` declarado
justamente na classe renomeada. Ele passa.

### Os gates

`pnpm lint`, `pnpm typecheck`, `pnpm typecheck:sandcastle`, `pnpm test` (125
testes) e `pnpm build` verdes. O `pnpm test:e2e`, pelo espelho, passou inteiro:
**21 testes contra um Directus 10.13.1 de verdade**, incluindo os três specs de
trajeto sobre a coleção renomeada e os dois do contrato.

`pnpm test:integration` **não roda de dentro do sandbox**, e não é por causa
desta task: o `tests/run-docker-tests.js` só declara `runnerService` para a
suíte `e2e`. A `integration` cai no caminho da máquina e fala com
`http://localhost:<porta publicada>` — que é a porta do **host**, inalcançável
daqui. Ela morre em `setupTestEnvironment` depois de 180s de health check.
Verificado que é pré-existente: o diff dos três commits desta task **não toca
nenhum arquivo** que a suíte de integração usa (`tests/setup.ts`,
`tests/mapgrid.spec.ts`, `tests/helpers/directus-api.ts`, `tests/helpers/wait.ts`,
`tests/test-env.ts`, `tests/test-logger.ts`, `vitest.integration.config.ts`), e
`tests/mapgrid.spec.ts` não importa nada que foi renomeado. Dar um
`runnerService` à `integration` é conserto de uma linha, mas é outra task.
