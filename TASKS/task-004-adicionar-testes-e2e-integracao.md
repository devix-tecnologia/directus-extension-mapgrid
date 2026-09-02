# Task 004 — adicionar testes e2e/integracao

Status: in-progress
Type: test
Assignee: marcospatricio

## Description

adicionar testes e2e/integração escritos em **TypeScript** que confirmem o funcionamento da extensão mapgrid, seguindo o padrão estabelecido para testes de extensões de directus utilizado nos projetos [directus-extension-inframe](https://github.com/devix-tecnologia/directus-extension-inframe) e [directus-extension-push-notification](https://github.com/devix-tecnologia/directus-extension-push-notification): **Playwright** para os testes e2e, **Vitest** para os testes de integração e **Docker** (`docker-compose.test.yml`) para subir uma instância de directus isolada para os testes.

o próprio teste deve ser responsável por preparar o ambiente de validação, sem configuração manual: criar a coleção de teste com um campo de localização (tipo "Map"), popular com itens, configurar o mapgrid como layout de visualização da coleção e, então, confirmar o funcionamento da extensão.

como o mapgrid é um layout que apresenta uma coleção simultaneamente em mapa e grade, os testes devem validar os principais fluxos de uso sobre esse ambiente preparado de forma programática.

escopo esperado:

- replicar o setup de testes dos projetos de referência (playwright.config, vitest.config, `docker-compose.test.yml`, pasta `tests/`);
- testes criando a coleção de teste (campo "Map" + itens) e configurando o mapgrid como layout de visualização via API/UI dentro do próprio teste;
- testes e2e cobrindo renderização do mapa e da grade, carregamento dos itens e interação com os controles, confirmando o funcionamento da extensão, incluindo a validação de que, ao clicar em um registro do grid, o mapa centraliza automaticamente no marker correspondente ao item clicado;
- testes de integração cobrindo a lógica da extensão (construção do GeoJSON, manipulação e transformação dos dados);
- scripts de teste no `package.json` e documentação de execução no README, no padrão dos projetos de referência.

## Tasks

- [x] replicar o setup de testes dos projetos de referência (playwright.config, vitest.config, docker-compose.test.yml, pasta tests/)
- [x] implementar no teste a criação da coleção de teste (campo de localização "Map" + itens) e a configuração do mapgrid como layout de visualização
- [x] escrever testes e2e (Playwright) em TypeScript para renderização do mapa/grade, interação com os controles e confirmação do funcionamento, incluindo a centralização do mapa no marker ao clicar em um registro do grid
- [x] escrever testes de integração (Vitest) em TypeScript para a lógica da extensão (GeoJSON e manipulação de dados)
- [x] adicionar scripts de teste ao package.json e documentar a execução no README
- [x] validar execução dos testes juntamente com lint e typecheck

## Notes

- Referências do padrão de testes: [directus-extension-inframe](https://github.com/devix-tecnologia/directus-extension-inframe) e [directus-extension-push-notification](https://github.com/devix-tecnologia/directus-extension-push-notification)
- Documentação de extensões do directus: https://docs.directus.io/extensions/

## Parecer da revisão (2026-08-21)

Revisão completa da branch `feat/task-004` com bateria final verde: **unit 13/13, integração 12/12, e2e 8/8, lint 0 erros, typecheck e build ok**, executados via runner oficial com containers Docker recém-criados. Escopo da task atendido.

### Problemas encontrados na revisão e corrigidos

1. **Testes de integração não testavam o código real** — reimplementavam localmente `buildGeoJson`, `resolveFieldTemplate` e resolução de coordenadas (cópia da lógica de produção). Extraídos os módulos compartilhados `src/geojson.ts` e `src/defaults.ts`, agora consumidos tanto pela extensão quanto pelos testes; um bug real foi descoberto no processo: a regex de template com flag `g` era stateful (`lastIndex`) e corrompia `matchAll`.
2. **Bug real de UX descoberto pelo e2e** — o `watchEffect` do `MapComponent.vue` chamava `fitBoundsToItems()` em toda atualização de `items`; um refetch do `useItems` durante o `flyTo` cancelava a animação e puxava a câmera de volta ao overview (~50% de falha sob 4 workers). Corrigido com guarda `hasPerformedInitialFitBounds` (fitBounds automático apenas uma vez por montagem; botão de reset continua funcional).
3. **Setup e2e com condição de corrida** — setup por worker (`beforeAll` com 4 workers) derrubava/recriava coleções concorrentemente (HTTP 500). Migrado para `global-setup`/`global-teardown` do Playwright com preset global criado via API (elimina também o clique frágil no seletor de layout).
4. **Duplicação massiva na infra de teste** — runners `run-e2e.js`/`run-integration.js` (~150 linhas repetidas), helpers duplicados e credenciais espalhadas consolidados em `tests/run-docker-tests.js` + `tests/helpers/` (`directus-api`, `wait`, `mapgrid-preset`); porta dinâmica no `docker-compose.test.yml` evita conflito com stacks locais.
5. **Código com comentários/refs frágeis** — removidos `@ts-expect-error`, `biome-ignore` e catches vazios comentados; câmera do mapa exposta via `data-center`/`data-zoom` para asserção determinística; cliques em marker via projeção Web Mercator própria (`map-projection.ts`) em vez de coordenadas fixas.
6. **Asserções fracas substituídas** — padrão "settle-then-assert" trocado por `expect.poll` nos testes de câmera; teste tautológico de defaults removido; empty-state deixou de usar `test.skip()`.

### Observações restantes (fora do escopo)

- Warnings pré-existentes de `noExplicitAny` nos mocks de `.storybook/` (não relacionados à task).
- O teste de empty-state valida apenas o `v-info` padrão do Directus; um estado vazio customizado do mapgrid exigiria mudança de comportamento no componente.

## Segunda rodada de revisão — princípios Total TypeScript (2026-08-21)

Revisão independente focada em tipos honestos, nomes autoexplicativos e ausência de comentários. Onze pontos identificados (P1–P11), todos corrigidos e validados com bateria completa verde: **unit 13/13, integração 12/12, e2e 8/8, lint 0 erros, typecheck (main + testes) ok, build ok**.

### Correções aplicadas

1. **Testes TypeScript não eram verificados pelo compilador** — `tsconfig.json` limitava `include` a `src/` com `rootDir`; ~800 linhas em `tests/` só eram checadas sintaticamente pelo Biome. Criado `tsconfig.tests.json` (inclui `src/**/*.ts`, `tests/**/*.ts` e configs de teste) e script `typecheck` encadeia ambos.
2. **Divergências de dependência expostas pelo novo typecheck** — duas cópias de vue (3.5.18 via extensions-sdk vs 3.5.22 raiz) deduplicadas via override pnpm; `@vitejs/plugin-vue` 6→5.2.4 e `vite` ^5 fixado na raiz para coincidir com o vite do vitest (o SDK preserva seu vite aninhado); `@types/node` adicionado.
3. **Erros reais revelados nos testes** — `maxThreads`/`minThreads` fora do lugar em `vitest.integration.config.ts` (movidos para `poolOptions.threads`), diretiva `tooltipDirective` sem tipo (`Directive` do vue), `TestItem` sem index signature (incompatível com `RowItem`).
4. **Assinaturas que mentiam** — `serializeItemRow` declarava `item: RowItem` mas tratava null/undefined no corpo, forçando casts `as unknown as` no teste; assinatura alargada e casts removidos.
5. **Duplo cast eliminado** — type guard `hasPointCoordinates` substitui `'coordinates' in (value as Record<...>)` + recast em `serializeFieldValue`.
6. **Guard caseiro substituído por API idiomática** — duck-typing `'value' in candidate` trocado por `toValue()` + `MaybeRefOrGetter` em `src/index.ts`.
7. **Detecção de placeholder stateless** — comparação de strings (`resolvedTemplate !== template`) substituída por regex não-global com `.test()`; imune ao bug histórico de `lastIndex`.
8. **Fonte única de verdade** — `EMPTY_COLLECTION_NAME` centralizada em `tests/helper-collection.ts` (antes duplicada em global-setup e spec); teardown explícito com `COLLECTION_NAME`.
9. **Código morto removido** — re-export `sleep` sem consumidores; `setCurrentTest`, `dockerProgress` e propriedade `currentTest` nunca chamados; props `deleteItems`/`deleteSelectedItems` não usadas em `MapGridLayout.vue`.
10. **Guarda duplicada extraída** — `performInitialFitBoundsOnce()` unifica lógica repetida no handler `load` e no `watchEffect` do `MapComponent.vue`.
11. **Robustez e reuso** — `waitForCameraToSettle` ganhou deadline de 30s (antes pendurava até o timeout global de 180s); `resourceExists` reimplementado sobre `apiRequest` (elimina duplicação de axios config).

Resultado líquido: -111 linhas. Nenhum comentário adicionado; nenhum commit realizado (alterações na árvore de trabalho, aguardando decisão de commit).

## Ajustes Storybook aplicados — lista de commit/push (2026-08-31)

Ajustes aplicados na branch `feat/task-004` para alinhar o Storybook ao comportamento do branch
de referência `feat/task-002-sidarta` (grid, mapa, opções e tema). **Nenhum commit realizado** —
alterações na árvore de trabalho, aguardando decisão de commit.

### Root cause geral

O `preview.ts` do `feat/task-004` estava vazio (sem `setup()`), portanto os componentes
`v-*` do Directus usados nas stories não eram registrados como componentes Vue no Storybook —
ficavam como custom elements nativos não instanciados. Além disso, os stubs de `src/mocks/directus-mocks.ts`
eram genéricos (`<div><slot /></div>`), o que impedia a renderização visual de grid, mapa, opções e botões.

### Correções aplicadas

1. **`v-table` rico (grid)** — `src/mocks/directus-mocks.ts`: substituído o stub genérico por
   `vTableStub` que renderiza um `<table>` real (`thead` com headers, `tbody` com linhas
   `:data-id`, slots `item.*` e emit `click:row`). Antes renderizava um `<div>` vazio, por isso
   o grid não aparecia nos cenários TableComponent e MapgridLayout.
2. **`preview.ts` registra componentes** — `.storybook/preview.ts`: adicionado
   `setup((app) => { registerDirectusMockComponents(app); ... })` para registrar os mocks como
   componentes Vue antes de montar as stories.
3. **Stories TableComponent** — `TableComponent.stories.ts`: passou a usar `generateMockData()`
   (headers reais ID/Nome/Localização + itens GeoItem), alinhando ao sidarta; a coluna
   "Actions" é adicionada pelo `resolvedHeaders` do componente.
4. **Stories MapgridLayout** — `MapgridLayout.stories.ts`: `WithData` renomeado para `Default`,
   usando `generateMockData()` com itens `GeoItem` válidos (`nome`/`localizacao` com
   `{ type: 'Point', coordinates }`). O shape errado anterior (`name`/`position`) fazia o mapa
   não renderizar os markers. Agora mapa (MapLibre) + grid aparecem juntos.
5. **Alinhamento do grid** — adicionado ao `mockComponentsStyles`:
   `table { width: 100%; table-layout: fixed; border-collapse: collapse }`, `th` sticky com
   fundo, bordas e `tbody tr:hover` — eliminando o desalinhamento entre header e células.
6. **Loading/Empty visíveis** — `vInfoStub` (renderiza título via `{{ title }}` + slot `#append`)
   e `vProgressCircularStub` (renderiza spinner). Antes os cenários Loading e Empty apareciam vazios.
7. **MapgridOptions completo** — `vDetailStub` (`<details><summary>{{ header }}</summary><slot /></details>`),
   `vSelectStub` (`<select>` com options), `vCheckboxStub`, `vCollectionFieldTemplateStub` e
   `vInputStub`. Antes os headers das seções e os controles não apareciam.
8. **Botão MapToolbar no padrão Directus** — `vButtonStub` replicando a estrutura real do
   `v-button.vue` do Directus (wrapper `.v-button` + `<button class="button">` com `.content`,
   props `icon`/`rounded`/`secondary`/`danger`/`warning`/`outlined`/sizes) e `vIconStub`
   (renderiza `{{ name }}`). Validado: botão circular 40x40px, fundo branco, ícone primário
   `#6644ff` ("zoom_out_map").
9. **Tema Directus no Storybook** — criado `.storybook/directus-theme.css`
   (importado no `preview.ts`) com as CSS variables do tema claro do Directus
   (`--theme--primary: #6644ff`, `--theme--background`, `--theme--foreground`, `--theme--border-*`,
   `--form-vertical-gap`, `--content-padding`, etc.). Sem elas, as `var(--theme--*)` não resolviam
   no Storybook (ex.: o botão ficava com fundo roxo em vez de branco).
10. **Story do DeleteAction (completa o storytype)** — criado `DeleteAction.stories.ts` (o único
    componente que ainda não tinha story). Usa args inline com `deleteSelectedItems` como função
    `async` **plain** em vez de `generateMockData()` do mock — pois o mock usa `vi.fn()` do Vitest,
    que quebra no contexto do Storybook ("Vitest failed to access its internal state"). Cenários:
    `Default` (2 itens selecionados → botão circular 40x40px com ícone "delete") e `NoItems`
    (nenhum item → botão ausente). Isso fecha o checklist item 1 (subtipo com storytype completo).

### Validação

| Comando | Resultado |
|---|---|
| `pnpm test` | 18/18 ✔ |
| `pnpm lint` | 0 erros (6 warnings pré-existentes em `.storybook/`) ✔ |
| `pnpm typecheck` | apenas o erro pré-existente de `@vue/reactivity` em `src/index.ts` (não relacionado) |
| `pnpm build` | ✔ |
| `pnpm build-storybook` | ✔ |

Verificação headless via Playwright no dev server :6006 confirma o render dos cenários:
TableComponent (grid com 4 linhas, header ID/Nome/Localização/Actions), MapgridLayout/Default
(mapa MapLibre + grid), MapgridOptions (5 seções com headers + 6 selects + 5 inputs + 1 checkbox),
MapToolbar (botão circular com ícone), DeleteAction (Default → botão circular 40x40px com ícone
"delete"; NoItems → sem botão) e Loading/Empty (título + spinner).

### Observação

A seção "Map Center" do MapgridOptions é uma feature adicional legítima do `feat/task-004`
(o layout suporta `mapCenterLng`/`mapCenterLat`/`mapZoom`) que não existe no
`feat/task-002-sidarta`. Foi mantida — removê-la desabilitaria o ajuste do centro do mapa.

### Arquivos alterados

- `.storybook/preview.ts`
- `.storybook/directus-theme.css` (novo)
- `src/mocks/directus-mocks.ts`
- `src/components/organisms/table-component/TableComponent.stories.ts`
- `src/components/templates/mapgrid-layout/MapgridLayout.stories.ts`
- `src/components/atoms/delete-action/DeleteAction.stories.ts` (novo)

## Teste e2e adicional — seleção de linha × delete habilitado (2026-09-01)

Cenário adicionado ao e2e para cobrir comportamento que existia no `feat/task-002`: ao marcar o
checkbox de uma linha no grid (`v-table` com `show-select`), o botão delete no header do layout
(`DeleteAction` no slot `actions`) fica visível e abre o diálogo de confirmação. O cenário clica
Cancel para preservar os dados dos testes paralelos.

### Fix técnica

O `v-checkbox` do Directus renderiza como `<button role="checkbox" aria-pressed="false">`,
não como `<input type="checkbox">`. O botão delete do `DeleteAction` usa a classe `delete-btn`
dentro do wrapper `.header-bar` do layout. O diálogo de confirmação do Directus não usa
`role="dialog"` — a assersão usa `getByText` em vez de `getByRole`.

Validação: `pnpm test:e2e` 9/9 ✔, `pnpm lint` 0 erros (6 warnings pré-existentes) ✔,
`pnpm typecheck` ✔.

## Commits agrupados e push (2026-09-01)

O stash de backup dos arquivos de Storybook foi restaurado e o trabalho foi commitado e enviado
para `origin/feat/task-004` em **3 commits separados por domínio**, conforme orientação do gerente
de projeto. Working tree limpo após o push.

| Hash | Commit | Domínio | Conteúdo |
|---|---|---|---|
| `e0a92f8` | `refactor(task-004): reestruturar componentes em Atomic Design com storytype` | Atomic Design | Componentes em subdiretórios kebab-case com storytype completo (.mock/.types/.test/.vue/index), services layer (`geo/`, `table/`, `value-formatter/`), mocks centralizados (`src/mocks/directus-mocks.ts`), nível `pages/`, remoção dos arquivos flat antigos e utilitários soltos, barrels (`src/index.ts`, `components/index.ts`, `types.ts`), `vitest.config.ts` (inclui `*.test.ts`) e `biome.json` (noUnusedImports) |
| `bc2298f` | `test(e2e): adicionar gravação de evidências com report HTML` | e2e/Playwright | `playwright.record.config.ts` (video/screenshot `on`), scripts `test:e2e:record` e `test:e2e:record:head` (abre o report), override pnpm movido para `pnpm-workspace.yaml` (remove warning do pnpm 11), doc da tarefa |
| `99a51c9` | `feat(storybook): alinhar stories com tema Directus e storytype completo` | Storybook | 7 `.stories.ts` atuais movidos para subdiretórios kebab-case, 4 `.stories.ts` antigos removidos, `.storybook/preview.ts` com `setup()` de registro dos mocks, `.storybook/directus-theme.css` (tema claro Directus), `DeleteAction.stories.ts` (completa o storytype), plano de storytype |

Validação antes do push: `pnpm test` 18/18 ✔, `pnpm lint` 0 erros (6 warnings pré-existentes em
`.storybook/`) ✔, `pnpm typecheck` ✔, `pnpm build` ✔.

Push: `25e123a..99a51c9 feat/task-004 -> feat/task-004` ✔

## Terceira rodada de revisão — vue-tsc no typecheck (2026-09-01)

Revisão focada em checagem de tipos efetiva dos componentes `.vue`, aplicando o escopo aprovado
"A1–A8". **Descoberta-chave**: as rodadas anteriores reportavam `pnpm typecheck` verde, mas o
`tsc` (assim como o build via esbuild) **não checa `<script setup>` de arquivos `.vue`** —
`src/shims.d.ts` tipa todo `.vue` como `DefineComponent`, então apenas 0 arquivos `.vue` eram
verificados. Com o `vue-tsc` (devDependency 3.3.11) adicionado ao script `typecheck`, **7 erros
reais** vieram à tona: 3 em `MapComponent.vue`, 2 em `MapgridLayout.vue` e 2 em `MapgridOptions.vue`.

### Root cause do erro mais obscuro (TS2322 no `MapComponent.vue:58`)

`ref<maplibregl.Map | null>(null)` envia a classe `Map` do maplibre pela utilidade `UnwrapRef`
do Vue, que mapeia recursivamente toda propriedade pública do objeto em um clone estrutural —
perdendo os membros privados de `Style` (`_createLayers`, `_serializeByIds`, `_serializedAllLayers`).
Resultado: `.value` do ref deixava de ser atribuível ao próprio `maplibregl.Map`. A correção é
anotar o ref explicitamente com `Ref<T>` (preserva a classe nominal), em vez do generic em linha:
`const map: Ref<maplibregl.Map | null> = ref(null)`. Do mesmo efeito, os filtros de cluster
(`['has', 'point_count']`) foram tipados como `FilterSpecification` — antes eram `string[]`.

### Correções aplicadas

1. **A1 — `vue-tsc --noEmit` no script `typecheck`** (`vue-tsc --noEmit && tsc --noEmit -p tsconfig.tests.json`) e correção dos 7 erros: `ref` do mapa com `Ref<T>` (TS2322 de `MapComponent.vue:58`), `CLUSTER_FILTER`/`UNCLUSTERED_FILTER` tipados como `FilterSpecification` (linhas 262/281), e `geolocation`/`title` normalizados com `?? ''` no `MapgridLayout.vue` antes de repassar às props obrigatórias do `MapComponent` (linhas 15/16).
2. **A2 — cast inline eliminado em `getItemCoordinates`** (`geo.ts`): `item[geolocation] as GeolocationData | undefined` em vez do objeto anônimo; export tipo morto `GeolocationData` removido do barrel `geo/index.ts`.
3. **A3 — API idiomática no `MapgridOptions.vue`**: o acesso a `collection.fields` (3 níveis de `Array.isArray` defensivos + interface local `GeolocationField`) virou `toValue(collection.fields).filter((f) => f.meta?.interface === 'map')` com o tipo `Field` do `@directus/types`.
4. **A4 — `DeleteAction.vue`** passou a usar `DeleteActionProps` do `.types` (props inline duplicadas removidas).
5. **A5 — `console.log` removidos** das histórias `Default`/`NoItems` de `DeleteAction.stories.ts`.
6. **A6 — diretivas de tooltip unificadas** em `tooltipDirective` (a variante local `vTooltipDirective` era código morto) e registro global no Vitest via `src/test-setup.ts` (`config.global.directives` + `setupFiles` no `vitest.config.ts`); removido o registro manual nos 3 mounts de `MapComponent.test.ts`. Warnings `Failed to resolve directive: tooltip` eliminados de `TableComponent.test.ts` e `DeleteAction.test.ts`.
7. **A7 — guarda redundante removida**: `if (!instance || !item || !coords)` virou `if (!instance || !coords)` em `focusOnItem` (`item` é parâmetro tipado).
8. **A8 — nullish check em `resolveMapCenter`**: `props.centerLng && props.centerLat` → `props.centerLng != null && props.centerLat != null`; `0` (meridiano de Greenwich) agora é um centro válido.

### Validação

| Comando | Resultado |
|---|---|
| `pnpm test` | 18/18 ✔ (warnings de diretiva eliminados) |
| `pnpm lint` | 0 erros (6 warnings pré-existentes em `.storybook/`) ✔ |
| `pnpm typecheck` | vue-tsc + tsc testes — 0 erros ✔ |
| `pnpm build` | ✔ |

### Observações

- Permanece um warning pré-existente no `MapgridOptions.test.ts` (`Invalid prop: type check failed for
  prop "collection"` no `v-collection-field-template`), relativo ao mock do `useCollection` no teste —
  fora do escopo desta rodada.
- Nenhum comentário adicionado; `tmp-repro/` (usado para isolar o TS2322) removido. Alterações na
  árvore de trabalho (13 arquivos + `src/test-setup.ts` novo), **aguardando decisão de commit**.

## Ajustes de revisão Storybook/UI + permissões — lista de commit/push (2026-09-02)

Ajustes aplicados na branch `feat/task-004` para deixar o Mapgrid **independente do Directus**
(revisão de UI vs proposta + fluxo de edição + permissões), conforme revisões encadeadas nesta sessão.
**Nenhum commit realizado** — alterações na árvore de trabalho, aguardando decisão de commit.

### 1. Remoção do MapToolbar (componente excedente)

`MapToolbar` (botão circular "Reset view", `zoom_out_map`) removido por completo — não faz parte da
proposta de UI independente.

- `src/components/molecules/map-toolbar/` deletado (`.vue`, `.types.ts`, `.mock.ts`, `.test.ts`,
  `.stories.ts`, `index.ts`); diretório `molecules/` ficou vazio.
- `MapComponent.vue`: removidos `<MapToolbar @reset>` do template, import, função `resetMap` e a
  exposição `resetMap` no `defineExpose` (agora `{ focusOnItem, getCameraState }`).
- `src/components/index.ts`: export `MapToolbar` removido.
- `MapComponent.test.ts`: removido o teste "should render reset button" (ficaram 2 testes).
- `tests/e2e/mapgrid-layout.spec.ts`: removido o teste do botão reset e a constante
  `OVERVIEW_ZOOM_THRESHOLD` (mantida `FOCUSED_ZOOM_THRESHOLD`).

### 2. Correções de UI no Storybook

- **`.map-wrapper` com `height: 100%`** (`MapComponent.vue`) — restaurado para o mapa renderizar em
  qualquer container (a revisão detectou a perda do height original).
- **`vTableStub` renderiza seleção e edição** (`src/mocks/directus-mocks.ts`):
  - Coluna de **checkbox** (select-all no header + por linha) quando `show-select` — reativa via
    `localSelected` (estado interno) para funcionar no Storybook sem parent; diffusão de
    `update:modelValue`.
  - Ícone de edição como **SVG de lápis** no `vIconStub` para `name="edit"` (antes era só o texto "edit").
  - **Select-all do header marca/desmarca todas as linhas** (via estado interno refletido).
- **`vProgressCircularStub`**: emoji `⏳` trocado por **spinner CSS** (anel giratório com `@keyframes`),
  no estilo Directus.

### 3. Testes de interação (`play`) e addons

- Instalados `@storybook/test@8.6.18` e `@storybook/addon-interactions@8.6.18` (devDependencies,
  alinhados ao Storybook 8.6.18). Registrado o addon em `.storybook/main.ts`.
- `play` adicionados: `MapComponent/Default` (verifica `.map-container`), `MapgridLayout/Default`
  (verifica `.mapgrid-container`) e `TableComponent/Default` (clica a primeira linha).

### 4. Unificação de mocks de mapa

`MapComponent.stories.ts` passou a usar `mockGeoItems` central com campo `localizacao` e
`title: '{{nome}}'` (antes usava itens inline com `position`/`name`), corrigindo a divergência entre
os stories de mapa e alinhando o GeoJson.

### 5. Wrapper compacto do MapgridOptions

`MapgridOptions.stories.ts`: canvas agora renderiza em wrapper de painel lateral (380px + padding 16px
+ fundo), reproduzindo o contexto real de um painel de layout do Directus.

### 6. Fluxo de edição independente do Directus

- **`MapgridLayout.vue`**: o clique do lápis passa a **emitir `edit-item`** em vez de
  `router.push('/content/...')` (Directus). Removidos `useRouter`/`vue-router`. O consumer decide o
  que fazer com a edição.
- **`MapgridLayout.types.ts`**: novo emit `'edit-item': [item: GeoItem]`.
- **Story `WithEditFlow`** (`MapgridLayout.stories.ts`): demonstra o fluxo completo de edição — clica
  no lápis → abre overlay de edição mock (formulário com campo Nome, Salvar/Cancelar) por `defineComponent`
  com `setup: () => ({ args })` (mesmo padrão das demais stories).

### 7. Permissões de edição/deleção (independentes do Directus)

Como o delete no Directus acontece no menu principal (fora do Mapgrid), a representação no grid é o
**checkbox de seleção**: usuário sem permissão de delete não pode selecionar linhas.

- **`TableComponent`** (`.types.ts`/`.vue`): props `canEdit?`/`canDelete?` (default `true` via
  `withDefaults`, evitando que `:can-delete="undefined"` sobrescreva o default).
  - `canEdit: false` → lápis de edição **não é renderizado**.
  - `canDelete: false` → checkboxes de seleção **desabilitados** (select-all e por linha).
- **`MapgridLayout`** (`.types.ts`/`.vue`): repassa `canEdit`/`canDelete` ao `TableComponent`.
- **`vTableStub`**: prop `canDelete` aplica `:disabled` aos checkboxes.
- **Stories**:
  - `TableComponent`: `Permissão: sem edição`, `Permissão: sem deleção`,
    `Permissão: sem edição e sem deleção`.
  - `MapgridLayout`: `Permissão: sem edição e sem deleção` (renomeado de `ReadOnlyPermission`).

### Validação

| Comando | Resultado |
|---|---|
| `pnpm typecheck` | 0 erros ✔ |
| `pnpm lint` | 0 erros (6 warnings pré-existentes em `.storybook/`) ✔ |
| `pnpm test` | 16/16 ✔ |
| `pnpm build-storybook` | ✔ |

Verificação de comportamento via mount: default → lápis presente + checkbox habilitado;
`canDelete:false` → checkboxes disabled; `canEdit:false` → sem lápis. Mapgrid operando de forma
independente (sem `@directus/extensions-sdk`/`vue-router` no fluxo de edição).

### Arquivos alterados (a serem commitados)

- `.storybook/main.ts`
- `package.json`, `pnpm-lock.yaml`
- `src/components/molecules/map-toolbar/` (deletado)
- `src/components/index.ts`
- `src/components/organisms/map-component/MapComponent.vue`, `MapComponent.stories.ts`, `MapComponent.test.ts`
- `src/components/organisms/table-component/TableComponent.vue`, `TableComponent.types.ts`,
  `TableComponent.mock.ts`, `TableComponent.stories.ts`
- `src/components/templates/mapgrid-layout/MapgridLayout.vue`, `MapgridLayout.types.ts`,
  `MapgridLayout.mock.ts`, `MapgridLayout.stories.ts`
- `src/components/templates/mapgrid-options/MapgridOptions.stories.ts`
- `src/mocks/directus-mocks.ts`
- `tests/e2e/mapgrid-layout.spec.ts`

### Observação

Plano de revisão (`TASKS/planos/plan-task-004-revisar-storybook-ui.md`) permanece **sem commit**
(untracked), como documentação analítica da revisão.

## Quarta rodada de revisão — Total TypeScript (2026-09-02)

Revisão transversal de todos os arquivos da árvore de trabalho prontos para commit, sob o crivo
Total TypeScript (nomes autoexplicativos, tipos honestos, ausência de comentários). **Nenhum
comentário encontrado em arquivo-fonte** — bateria verde antes do ajuste: typecheck 0 erros,
lint 0 erros (6 warnings pré-existentes em `.storybook/mocks/`), unit 16/16, build-storybook ✔.

### Ajustes propostos e decisão

Três micro-ajustes candidatos foram levantados; após aplicar e revalidar, **P1 e P3 foram
descartados** (falsos positivos) e apenas **P2 foi mantido**:

| # | Proposta | Decisão | Justificativa |
|---|---|---|---|
| P1 | Remover o cast `as GeoItem` em `MapgridLayout.mock.ts` (`'edit-item'`) | **Descartado** | `noUncheckedIndexedAccess: true` → `mockGeoItems[0]` é `GeoItem \| undefined`; o cast é **necessário** ao tipo do emit `[item: GeoItem]`. |
| P2 | Remover o alias `const sampleItems = mockGeoItems` em `MapComponent.stories.ts` | **Aplicado** | Alias sem ganho — referência direta a `mockGeoItems` nos args de `Default`/`WithZoomOnClick`. |
| P3 | `TableComponent.mock.ts` reusar `mockGeoItems[0]` em vez do `firstItem` declarado | **Descartado** | O `firstItem` tipado `GeoItem` com literal inline é a forma correta sob `noUncheckedIndexedAccess` (indexar `mockGeoItems[0]` devolveria `Geolocation \| undefined` e quebraria os tipos). |

Lição do crivo: casts e literais tipados **não são** código redundante quando o acesso indexado é
não-checado — são proteção honesta de tipo. A tentativa de "limpar" expôs exatamente isso na
revalidação (`Type 'RowItem \| undefined' is not assignable to type 'RowItem'`), comprovando que o
estado original estava correto.

### Revalidação após o ajuste P2

| Comando | Resultado |
|---|---|
| `pnpm typecheck` | 0 erros ✔ |
| `pnpm lint` | 0 erros (6 warnings pré-existentes em `.storybook/`) ✔ |
| `pnpm test` | 16/16 ✔ |
| `pnpm build-storybook` | ✔ |

### Arquivo alterado (net)

- `src/components/organisms/map-component/MapComponent.stories.ts` (removido o alias `sampleItems`)

Árvore de trabalho pronta para commit.
