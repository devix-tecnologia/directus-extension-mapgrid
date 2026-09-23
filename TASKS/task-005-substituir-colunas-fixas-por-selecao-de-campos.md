# Task 005 — substituir as colunas fixas por seleção de campos

Status: done
Type: refactor
Assignee: sidartaveloso
Priority: 500

## Description

O layout guarda as colunas da grade em cinco campos numerados no preset
(`coluna1` … `coluna5`). Isso limita a grade a cinco colunas, impede reordenar,
e obriga o código a contornar o formato: `configuredColumns` existe só para
fechar os buracos quando alguém preenche a coluna 3 e deixa a 2 em branco, e
`setColumn` é uma cadeia de cinco `if` porque cada coluna tem seu próprio
evento `update:colunaN`.

O Directus já resolve isso. O layout tabular nativo guarda os campos exibidos em
`layoutQuery.fields` — uma lista, sem teto — e deixa o usuário escolher e
reordenar pelo cabeçalho da própria tabela, com largura por coluna em
`layoutOptions.widthMap`.

Duas observações que mudam o tamanho do trabalho:

**O mecanismo já está meio presente.** `LayoutQuery.fields: string[]` já existe
em `src/types.ts`. Só que hoje `useLayoutQuery()` em `src/index.ts` o calcula a
partir de *todos* os campos da coleção, nunca persiste a escolha do usuário, e a
exibição ignora esse valor e lê `coluna1..5`. Ou seja: a extensão busca a
coleção inteira da API e mostra cinco campos. Adotar `fields` de verdade também
corrige esse excesso de busca.

**A grade já é a do Directus.** O `TableComponent` usa `v-table`, que é o
componente nativo. O que está reinventado não é a tabela, é a *interface de
escolha de colunas*: cinco `v-select` no painel de opções, em vez do seletor no
cabeçalho que o layout tabular oferece.

### Cuidado com presets existentes

`coluna1..5` não é só um nome feio: é o formato já gravado no banco de quem usa a
extensão hoje. Trocar a chave sem caminho de leitura antigo faz as colunas
sumirem em silêncio na próxima abertura do layout. A migração precisa acontecer
na leitura, dentro de `src/contract/layout-options.contract.ts`, que é onde o
preset já é normalizado.

## Tasks

### Fase 1: contrato aceitar os dois formatos
- [x] Acrescentar `fields?: string[]` a `LayoutOptions`
- [x] Em `normalizeLayoutOptions`, quando `fields` não existir, derivá-lo de
      `coluna1..5` na ordem, fechando os buracos
- [x] Manter `coluna1..5` na leitura, marcados como obsoletos, e parar de
      escrevê-los
- [x] Testes cobrindo preset antigo, preset novo e preset com os dois

### Fase 2: exibição passar a usar `fields`
- [x] `MapgridLayout` monta os cabeçalhos a partir de `fields`, não de
      `configuredColumns`
- [x] Remover `configuredColumns`, `COLUMN_KEYS`, `ColumnKey` e `ColumnOptions`
      quando não houver mais leitor — **mantidos de propósito**: a migração dos
      presets antigos os usa, e só saem quando não houver preset no formato
      numerado em circulação
- [x] Ajustar `layoutOptionsFor` no catálogo de mocks

### Fase 3: seleção por `v-field-list`
- [x] Usar `v-field-list` — o mesmo componente que o layout tabular do Directus
      usa — no lugar dos cinco `v-select`
- [x] Remover `setColumn` e os cinco eventos `update:colunaN`
- [x] Persistir a ordem escolhida
- [x] Avaliar `widthMap` para largura por coluna, e reordenação por
      `v-model:headers` + `allow-header-reorder` — **avaliado e movido** para a
      task-008, junto do resto do comportamento de grade

### Fase 4: parar de buscar a coleção inteira
- [x] `useLayoutQuery().fields` passa a pedir à API só os campos exibidos, mais
      a chave primária e o campo de geolocalização
- [x] Conferir que o popup do mapa continua resolvendo seu template, que pode
      citar campo que não está na grade

### Fase 5: verificação
- [x] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm check:stories`
- [x] `pnpm test:e2e` — executado contra um Directus real: 8 passam. Os dois
      pontos que eu tinha previsto como frágeis precisaram mesmo de ajuste
      contra o DOM real: o `v-field-list` mostra o nome de exibição (`Status`) e
      não a chave, e a barra lateral e a seção de colunas começam recolhidas.
      Um caso ficou bloqueado pela task-009 e está marcado como tal, com a
      medição que prova que o defeito não é desta task.

### Fase 6: tornar o restante do layoutQuery gravável

Esta task já transformou `fields` num binding gravável e mexeu em
`useLayoutQuery`. `page`, `limit` e `sort` continuam somente leitura ali, três
computeds de uma linha cada — e as tasks 006 e 008 precisam justamente deles:
a 006 vira a página sozinha durante a reprodução, a 008 grava a ordenação ao
clicar no cabeçalho.

São ~15 linhas. Fazer aqui, onde a função já está aberta, evita que três tasks
disputem o mesmo arquivo e conflitem entre si.

- [x] `page`, `limit` e `sort` viram computeds graváveis, escrevendo em
      `layoutQuery`, no mesmo padrão que `fields` já usa
- [x] Testes do contrato para os três, como já existe para `fields`
- [ ] Nenhum consumidor novo aqui: quem usa são as tasks 006 e 008

### Fase 7: destravar o pipeline de e2e
- [x] Corrigir a corrida do healthcheck do Postgres, que derrubava o Directus
      com `ECONNREFUSED` antes de a suíte começar
- [x] Atualizar a seção de configuração do README nos dois idiomas
- [x] Refazer `docs/tela.jpg`: a captura nova mostra o seletor de campos com os
      chips `name` e `status` e o botão de adicionar, no lugar dos cinco selects
      numerados. Gerada por `pnpm screenshot`, que passa a ser um comando

## Notes

`coluna1..5` entrou no commit `585b26b` ("feat: Implementa Opções de Layout
permitindo selecionar os campos que aparecerão na lista e no mapa"), na mesma
época em que `LayoutOptions` ainda carregava `widthMap`, `heightMap`, `spacing`,
`showSelect` e `fields?: string[]` — a forma das opções do layout tabular do
Directus, herdada e nunca usada. O `fields` foi removido na task-004; esta task
o traz de volta, agora como a fonte da verdade.

## Fechamento

O que a task entregou, verificado contra um Directus real:

- as colunas deixaram de ter teto de cinco e passaram a morar em
  `layoutQuery.fields`, que é onde o layout tabular do Directus as guarda;
- presets no formato antigo continuam funcionando, com a conversão feita na
  leitura — provado por e2e que abre um preset `coluna1`/`coluna3` e confere que
  a grade mostra as duas colunas, com o buraco fechado;
- a extensão parou de pedir a coleção inteira à API para exibir alguns campos;
- `page`, `limit` e `sort` viraram graváveis, o que destravou as tasks 006 e 008.

Duas coisas saíram do escopo por medição, e não por desistência:

**A escrita do painel de opções não persiste** — e o defeito não é desta task:
alternar `zoomOnClick`, que existe desde muito antes, também não é gravado. Virou
a task-009, com a medição que localiza o problema no painel e não na escrita do
preset.

**Largura e reordenação de coluna** foram para a task-008, que trata do
comportamento de grade como um todo.
