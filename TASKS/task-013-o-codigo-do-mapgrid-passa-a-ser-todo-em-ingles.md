# 🧩 Task 013 — O código do MapGrid passa a ser todo em inglês

- Status: in-progress
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
- [ ] Renomear `src/`, com os testes passando a cada passo
- [ ] Renomear `tests/` e os títulos de teste
- [ ] Renomear `.sandcastle/` e `scripts/captura-de-tela/`
- [ ] Os três ajustes da revisão da task-012
- [ ] Nenhum identificador nem comentário em português sobrando no código
      (conferir por busca, e registrar aqui o que ficou de fora e por quê)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:sandcastle`, `pnpm test`
      e `pnpm test:e2e` verdes

## Notes
