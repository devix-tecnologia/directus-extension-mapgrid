# Task 005 — substituir as colunas fixas por seleção de campos

Status: todo
Type: refactor
Assignee:

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
- [ ] Acrescentar `fields?: string[]` a `LayoutOptions`
- [ ] Em `normalizeLayoutOptions`, quando `fields` não existir, derivá-lo de
      `coluna1..5` na ordem, fechando os buracos
- [ ] Manter `coluna1..5` na leitura, marcados como obsoletos, e parar de
      escrevê-los
- [ ] Testes cobrindo preset antigo, preset novo e preset com os dois

### Fase 2: exibição passar a usar `fields`
- [ ] `MapgridLayout` monta os cabeçalhos a partir de `fields`, não de
      `configuredColumns`
- [ ] Remover `configuredColumns`, `COLUMN_KEYS`, `ColumnKey` e `ColumnOptions`
      quando não houver mais leitor
- [ ] Ajustar `layoutOptionsFor` no catálogo de mocks

### Fase 3: seleção pelo cabeçalho
- [ ] Ligar o seletor de campos do `v-table` a `fields`, no lugar dos cinco
      `v-select` do painel de opções
- [ ] Remover `setColumn` e os cinco eventos `update:colunaN`
- [ ] Persistir a ordem escolhida
- [ ] Avaliar `widthMap` para largura por coluna, como o layout tabular faz

### Fase 4: parar de buscar a coleção inteira
- [ ] `useLayoutQuery().fields` passa a pedir à API só os campos exibidos, mais
      a chave primária e o campo de geolocalização
- [ ] Conferir que o popup do mapa continua resolvendo seu template, que pode
      citar campo que não está na grade

### Fase 5: verificação
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm check:stories`
- [ ] Abrir um preset gravado antes da mudança e confirmar que as colunas
      continuam aparecendo
- [ ] Atualizar a seção de configuração do README nos dois idiomas

## Notes

`coluna1..5` entrou no commit `585b26b` ("feat: Implementa Opções de Layout
permitindo selecionar os campos que aparecerão na lista e no mapa"), na mesma
época em que `LayoutOptions` ainda carregava `widthMap`, `heightMap`, `spacing`,
`showSelect` e `fields?: string[]` — a forma das opções do layout tabular do
Directus, herdada e nunca usada. O `fields` foi removido na task-004; esta task
o traz de volta, agora como a fonte da verdade.
