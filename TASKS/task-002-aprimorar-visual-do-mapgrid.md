# Task 002 — aprimorar visual do mapgrid

Status: in-progress
Type: feat
Assignee: marcospatricio

## Description

compatibilizar com o visual do directus, priorizando utilizar os componentes de UI do https://components.directus.io/

## Tasks

- [x] Refatorar options.vue — usar v-detail (accordion) para organizar seções de configuração
- [x] Refatorar layout.vue — container com variáveis de tema, estado vazio com v-info
- [x] Refatorar TableComponent.vue — scrollbar e seleção com variáveis de tema, remoção de console.logs
- [x] Refatorar MapComponent.vue — border herdado do pai, botão reset com variáveis de tema, remoção de console.logs
- [x] Build, lint e typecheck validados

## Alterações por arquivo

| Arquivo | Mudança |
|---|---|
| `src/options.vue` | Seções usando `v-detail` (accordion) com ícones, labels padronizados, removido HTML manual (`<div class="field">`, `<div class="type-label">`) |
| `src/layout.vue` | Classe renomeada para `mapgrid-*`, container com `border`/`border-radius` do tema, estado vazio com `v-info` |
| `src/components/TableComponent.vue` | Scrollbar com variáveis de tema (`--theme--background-subdued`, `--theme--foreground-subdued`), seleção de linha mais sutil, removidos console.logs, transição suave no ícone edit |
| `src/components/MapComponent.vue` | Border do mapa herdado do pai (container), botão de reset usando `var(--content-padding)`, removidos console.logs |

## Notes

- Componentes Diretus já eram utilizados (v-table, v-select, v-button, v-info, etc.), as melhorias foram em consistência de variáveis de tema e organização
- Erro de typecheck pré-existente em `src/index.ts` (mismatch `@vue/reactivity` 3.5.22 vs 3.5.18) — não relacionado a esta task
- Docker hot-reload funciona com `EXTENSIONS_AUTO_RELOAD: "true"`, mas rebuild manual (`pnpm build`) é necessário para refletir alterações

---

## Revisão de código (code review)

Revisão conduzida seguindo os princípios do **Total TypeScript** (Matt Pocock): comentários no código são sinal de que o código não foi suficientamente refatorado — nomes de funções, variáveis e tipos deveriam ser claros o suficiente para dispensá-los.

### Problemas encontrados e corrigidos

| Problema | Arquivos afetados | Solução aplicada |
|---|---|---|
| Comentários remanescentes no código-fonte | `index.ts` (4), `MapComponent.vue` (4) | Removidos. Lógica descrita por comentários extraída em funções nomeadas |
| `<script setup>` sem `lang="ts"` | `layout.vue`, `TableComponent.vue`, `MapComponent.vue` | Adicionado `<script setup lang="ts">` em todos |
| Cast `any` explícito | `options.vue` (`useCollection(collectionKey as any)`) | Removido — `collectionKey` já é `Ref<string>`, tipo compatível |
| Parâmetros sem tipo | Todos os `.vue` (handlers, refs, emits) | Interfaces `GeoItem`, `RowItem`, `Header`, `GeoJsonFeature` definidas; todos os parâmetros e refs tipados |
| Repetição de template (5 selects de coluna) | `options.vue` | Refatorado com `v-for` + constante `COLUMN_KEYS` |
| `REFACTORING.md` desatualizado | `REFACTORING.md` | Reescrito para refletir o estado real do código |

### Funções extraídas em `MapComponent.vue`

A função monolítica `focusOnItem` (que continha 4 comentários explicando o que o código já dizia) foi refatorada em funções nomeadas autoexplicativas:

| Função anterior | Funções extraídas |
|---|---|
| Bloco inline com comentário "Faz zoom..." | `flyToItem(coords)` |
| Bloco inline com comentário "Apenas destaca..." | `panToVisibleArea(coords)` + `flashHighlightMarker()` |
| Bloco inline com comentário "Move o mapa..." | `panToVisibleArea(coords)` |
| `generateGeoJson()` | `buildGeoJson()` (nome mais preciso) |
| `fitMapToMarkers()` | `fitBoundsToItems()` |
| `closeAllPopups()` | `dismissAllPopups()` |
| SVG inline sem função | `createClusterLabelElement(count)` |

### Validação

- `pnpm lint` — limpo (sem erros)
- `pnpm build` — sucesso
- `pnpm typecheck` — erros pré-existentes apenas (`@vue/reactivity` mismatch 3.5.22 vs 3.5.18 em `index.ts`)
- Comentários no código-fonte: **zero**

---

## REVISION NOTES

**Veredito: reprovar** — os ajustes abaixo serão executados pelo próprio time (não será devolvido ao responsável original marcospatricio).

Revisão do ramo `feat/task-002` (diff `develop...feat/task-002`, commits `71e83d4`, `661f900`, `a6c819b`), conduzida seguindo os princípios do **Total TypeScript** (Matt Pocock) e da **convenção Devix** de [estrutura de módulos](../dev-docs/padroes/estrutura-de-modulos.md). A spec visual foi atendida, mas o ramo já se declara "code review seguindo princípios Total TypeScript" e ainda carrega duplicação de tipos/lógica, casts inseguros, estado redundante e não segue a estrutura de módulos da Devix — itens em escopo de uma task de refatoração.

### O que está OK (spec atendida)

| Item da task | Status |
|---|---|
| `options.vue` — `v-detail` (accordion) | ✅ |
| `layout.vue` — container com variáveis de tema, estado vazio com `v-info` | ✅ |
| `TableComponent.vue` / `MapComponent.vue` — variáveis de tema, sem `console.log` | ✅ |
| `pnpm lint` / `pnpm build` | ✅ |
| `pnpm typecheck` | ❌ falha — ver ajuste obrigatório #8 |

> Erros pré-existentes não são aceitos na entrega: a task deve deixar `pnpm typecheck` sem nenhum erro.

### Ajustes obrigatórios antes de aprovar

1. **Tipos duplicados entre componentes** — `GeoItem` (`MapComponent.vue:15`), `RowItem` (`TableComponent.vue:44` e `layout.vue:38`) e `Header` (`TableComponent.vue:39` e `layout.vue:43`) são a mesma interface redefinida em 3 arquivos (já divergindo no nome). Extrair para um módulo de tipos (`.types.ts`). Contradiz o próprio `REFACTORING.md`, que afirma "Interfaces `GeoItem`, `RowItem`, `Header` definidas".
2. **Lógica de serialização duplicada e já divergente** — `resolveFieldValue` (`MapComponent.vue:66`) e `serializeValue` (`TableComponent.vue:73`) são funcionalmente idênticas, mas já divergem (fallback `[Object]` vs `JSON.stringify`). Extrair um único helper compartilhado.
3. **Extração de coordenadas repetida com casts** — `(item[props.geolocation] as { coordinates?: [number, number] } | undefined)?.coordinates` aparece em `buildGeoJson:82` e `fitBoundsToItems:101`, sempre com a checagem `length === 2`. Extrair `getItemCoordinates(item): [number, number] | null`.
4. **`map.value!` espalhado** — `openPopupAt:177`, `flyToItem:182`, `panToVisibleArea:186/195`, `flashHighlightMarker:200-202`. Substituir as non-null assertions por guard + variável local (`const m = map.value; if (!m) return;`).
5. **`.filter(Boolean) as string[]`** (`layout.vue:67-69`) — trocar por type predicate `.filter((c): c is string => Boolean(c))`.
6. **Magic strings repetidas** — ids de source/layers (`'points'`, `'clusters'`, `'unclustered-point'`) em `registerMapEvents` e `refreshClusterLabels`, e `duration: 1000` repetido. Extrair constantes.
7. **`zoomOnClick` com estado redundante** (`options.vue:22-30, 93-100`) — `localZoomOnClick` (ref) + `watch` + `emit` explícito são três mecanismos para um binding; `title` e `geolocation` usam `useSync` direto — fazer o mesmo.
8. **`pnpm typecheck` falhando** (`index.ts:22` e `:28`) — mismatch de dependência: os pacotes do Directus têm `peerDependency` em `vue 3.5.18`, enquanto o projeto usa `vue ^3.5.22` (`@vue/reactivity` 3.5.22 vs 3.5.18). **Erro pré-existente não é aceito**: resolver na task unificando a versão, ex. via `pnpm.overrides` no `package.json` (`"pnpm": { "overrides": { "vue": "^3.5.22" } }`) seguido de `pnpm install` — ou alinhando `vue` devDependency ao peer do Directus (3.5.18).
9. **Não segue a convenção Devix de [estrutura de módulos](../dev-docs/padroes/estrutura-de-modulos.md)** — a lógica compartilhada (tipos, serialização, extração de coordenadas, constantes) fica solta dentro dos `.vue`, em vez de módulos próprios. Aplicar o padrão: pasta kebab-case por classe/serviço (`nome-servico/nome-servico.ts`, `nome-servico.types.ts`, `nome-servico.test.ts`, `index.ts` barrel reexportando só a API pública), tipos em `.types.ts`, entrada externa como `unknown` estreitada (sem `any`). **Exceção aplicada**: o idioma dos nomes permanece **inglês**, por já ser o padrão do repositório (a convenção permite termos consagrados em inglês e o repo sobrepõe a preferência por português).

### Ajustes opcionais

- `m.on('error', () => {})` (`MapComponent.vue:320`) engole todos os erros do mapa em silêncio.
- `popups` é um array mas só existe um popup por vez (`dismissAllPopups` antes de cada `openPopupAt`) — um único `ref` bastaria.
- `useLayoutOptions` / `useLayoutQuery` (`index.ts`) parecem composables mas são funções internas — renomear ou comentar intenção.

### Validação esperada na reentrega

- `pnpm lint`, `pnpm build` e `pnpm typecheck` — **typecheck sem nenhum erro** (inclusive os antigos de `@vue/reactivity`, que devem ser resolvidos na task).
