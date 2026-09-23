# Task 010 — O MapGrid compõe os layouts do Directus

Status: pending
Type: refactor
Assignee: sidartaveloso
Priority: 10

## Description

Hoje a extensão **reimplementa** o que o Directus já tem: a nossa grade imita o
layout tabular, e o nosso mapa imita o layout de mapa. A proposta é inverter —
compor os dois layouts que o Directus já registra, e a extensão passa a ser a
composição e a sincronia entre eles, não a reimplementação de nenhum.

O spike de 2026-09-18/19 mediu isso ponta a ponta no Directus 10.13.1, no branch
`spike/tabular-embed`. O registro completo está na task-008; o essencial:

- `layout.setup(props, { emit })` roda de dentro do **nosso** `setup()`, fora do
  `createLayoutWrapper`. Como o Directus entrega o retorno do nosso `setup()`
  tanto ao componente quanto ao painel de opções, o estado nasce num lugar só e
  chega aos dois — é o que resolve o painel, que é irmão do layout na árvore.
- Os dois layouts montam: `tabular: ok, 68 chaves · map: ok, 76 chaves`.
- As duas configurações deles aparecem na nossa barra lateral, ligadas ao mesmo
  estado que desenha, e abrir os painéis custa **zero** consulta a mais.
- `selection` e `layoutQuery` compartilhados sincronizam os dois: marcar na
  grade aparece no estado comum, e ordenar pelo cabeçalho deles refaz a busca
  dos dois.
- O clique na linha volta a ser nosso trocando o `onRowClick`.

## O que se ganha

O menu de cabeçalho inteiro (ordenar, alinhar, ocultar campo), largura de
coluna, o seletor de campos com busca e submenus de relação, os displays do
Directus nas células, e a configuração do mapa deles: mapa base, campo
geoespacial, template de exibição e agrupamento.

## O que se perde, e o que fica (decidido em 2026-09-19)

Adotar o layout de mapa deles aposenta o nosso `MapComponent` e o `MapToolbar`.
Duas coisas ficam, por decisão:

- **O clique linha→mapa fica.** É a razão de existir da extensão, e o spike já
  provou que dá, trocando o `onRowClick`.
- **Reenquadrar e zoom ao clicar ficam.** Significa reconstruir o `MapToolbar`
  sobre o mapa deles — injetar controle nosso dentro do componente deles, que é
  a parte mais cara desta task e não foi medida pelo spike.

Vão embora: o template do popup como é hoje, o enquadramento inicial único
(`performInitialFitBoundsOnce`) e os rótulos de agrupamento próprios.

Isso encosta em duas tasks abertas:

- **task-006** (navegar e reproduzir os registros no mapa) teria de ser
  reconstruída sobre o mapa deles, ou abandonada.
- **task-007** (honrar a configuração de mapa do Directus) talvez seja
  *atendida* por esta, já que o layout deles lê a configuração nativa.

## Pré-requisito — destravado em 2026-09-19

A decisão do dia foi fazer a task-009 primeiro, porque alinhamento, largura,
mapa base, campo geoespacial e agrupamento moram todos em `layoutOptions`, e o
diagnóstico dela dizia que `layoutOptions` não chegava ao preset.

A medição foi refeita e **não há defeito**: o painel grava e sobrevive ao
reload. A 009 fechou como erro de medição, e o bloqueio não existe. O teste de
regressão está em `tests/e2e/mapgrid-options-persistence.spec.ts`.

## Tasks

### Fase 1: fundação
- [ ] Extrair do spike o `embedLayout(id, options)`: chama o `setup()` do layout
      registrado, acrescenta os `onUpdate:<chave>`, devolve estado, componente e
      `slots.options`. Sem `any` — o spike usa, a implementação não pode
- [ ] Repassar `...toRefs(props)` junto do estado, como o `createLayoutWrapper`
      faz: o spike devolveu 68 chaves contra as 92 do wrapper, e a diferença são
      os props
- [ ] Teste de contrato: falha alta se `tableHeaders`, `onSortChange`, `items`,
      `geometryField` ou `slots.options` sumirem do que o Directus devolve

### Fase 2: a composição
- [ ] `selection` e `layoutQuery` como estado único, os dois layouts escrevendo
- [ ] `onRowClick` nosso, para o clique na linha enquadrar em vez de navegar
- [ ] O caminho inverso: o `handleClick` do layout de mapa faz `router.push` para
      a tela do item quando não está em modo de seleção, então **clicar num ponto
      hoje sai do MapGrid**. Antes da composição, clicar no marcador selecionava a
      linha na grade, e o e2e que cobria isso ("should select the matching grid
      row when clicking a map marker") saiu na reescrita do `mapgrid-layout.spec.ts`.
      Trocar o `handleClick` como o `onRowClick` foi trocado, e devolver o e2e.
      A task-006 parte daqui para "clicar no ponto define o registro atual"
- [ ] Reverter as suposições de página inteira, que não estão na API e só o DOM
      revela: `.layout-tabular` traz `margin: 32px 0 132px`; o cabeçalho é
      `sticky` com deslocamento da altura do cabeçalho do app; `.layout-map`
      nasce `flex: 0 1 auto` e não estica
- [ ] Decidir o destino do `MapToolbar`, do zoom ao clicar e do popup

### Fase 3: o que sai
- [ ] `TableComponent`, `MapComponent`, `MapToolbar` e os stubs que os servem
- [ ] `table-sort.ts`, `fieldsToFetch` e o que mais deixar de ter chamador
- [ ] A migração de preset da task-005 **fica**: `layoutQuery.fields` continua
      sendo o contrato

### Fase 4: verificação
- [ ] Os 155 unitários de hoje se apoiam nos componentes que saem; refazer o que
      continuar valendo e apagar o que virar teste de código morto
- [ ] Stories: o Storybook não alcança os layouts do Directus, porque lá o SDK é
      um mock nosso. Decidir o que resta de story
- [ ] e2e é onde esta task se prova, e o ambiente do docker é o único lugar
- [ ] Reancorar os specs que ainda miram os componentes que saíram: o
      `mapgrid-columns.spec.ts` tem 9 seletores deles (`.map-container`,
      `.v-table`, `[data-sort-desc]`, `[data-remove-field]`) e a regressão da
      task-009 (`mapgrid-options-persistence.spec.ts`) espera por
      `.map-container`. Hoje esses specs falham por procurar a tela antiga, não
      por defeito
- [ ] Regressão de persistência herdada da task-009: gravar pelo painel uma
      opção de cada layout embutido (por exemplo `displayTemplate` do mapa e o
      espaçamento da grade) e conferir as duas no preset efetivo depois de um
      reload. Prova que `layoutOptions.map` e `layoutOptions.tabular` não se
      sobrescrevem, o que a regressão do `zoomOnClick` não alcança
- [ ] Regressão visual do espaço em branco, que é custo recorrente do desenho
- [ ] `pnpm screenshot` e evidência antes/depois
- [ ] README: a seção de colunas descreve a grade atual

## Notes

O `dist` da extensão resolve `@directus/extensions-sdk` como externo, então vale
o SDK do Directus em execução, não o que compilamos. O spike confirmou
`useLayout` e `useExtensions` no 10.13.1, que é o que o e2e roda.

Sobra uma consulta sem atribuição: um `GET /items/<colecao>/<id>` de item único
aparece no carregamento, e não achei a origem.

Nesta máquina `pnpm test:e2e` não funciona — o host não alcança portas
publicadas pelo docker. O caminho é `--profile runner`, de dentro da rede. E o
Directus carrega a extensão no boot: todo rebuild exige `docker restart`.
