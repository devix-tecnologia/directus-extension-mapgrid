# Plano de Execução — Aplicar Ajustes Storytype do feat/task-002-sidarta ao feat/task-004

**Status:** pendente
**Data:** 2026-08-31
**Responsável:** marcospatricio
**Branch destino:** feat/task-004
**Branch referência:** feat/task-002-sidarta

---

## Objetivo

Aplicar ao branch `feat/task-004` os mesmos ajustes estruturais (padrão storytype) que foram
aplicados no branch `feat/task-002-sidarta`: subdiretórios kebab-case por componente com
`.types.ts`, `.mock.ts`, `.test.ts`/`.stories.ts`, `index.ts` barrel, camada de services e
mocks centralizados — preservando toda a funcionalidade já existente no `feat/task-004`.

**Atenção:** Este plano NÃO deve ser commitado. É para análise do gerente de projeto.

---

## Análise da Genealogia

```
b511a16 (update/dependencies)
├── feat/task-002 (ca262f2) ── 5 commits
│   └── feat/task-003 (3d2d08c) ── +2 commits (Atomic Design + Total TS)
│       └── feat/task-004 (25e123a) ── +15 commits (testes, auto-detect, fixes)
│
└── feat/task-002-sidarta (c1a49be) ── 11 commits INDEPENDENTES
```

O branch `feat/task-002-sidarta` **não** nasceu de `feat/task-002`. Ambos nasceram de
`b511a16` e seguiram caminhos paralelos. O `feat/task-004` herdou a reorganização
Atomic Design do `feat/task-003` (commit `1918e81`), mas com arquivos flat (sem
subdiretórios storytype) e sem services/mocks.

---

## O que já existe em feat/task-004

| Item | Status |
|------|--------|
| Atomic Design (atoms/molecules/organisms/templates) | ✅ (arquivos flat) |
| Stories para todos os componentes | ✅ |
| Testes unitários (.spec.ts) | ✅ |
| Biome (linter + formatter) | ✅ |
| TypeScript types centralizados (types.ts) | ✅ |
| Funcionalidades: delete, auto-detect, map center/zoom | ✅ |
| Testes E2E e integração | ✅ |

## O que falta (ajustes do feat/task-002-sidarta)

| Item | Status |
|------|--------|
| Subdiretórios kebab-case com storytype completo | ❌ |
| Camada de services (geo/, table/, value-formatter/) | ❌ |
| Mocks centralizados (directus-mocks.ts) | ❌ |
| Componentes ValueCell e MapToolbar (extraídos) | ❌ |
| Arquivos .types.ts por componente | ❌ |
| Nível pages/ | ❌ |

---

## Plano de Ação

### Fase 1 — Criar camada de Services

Extrair lógica compartilhada de `geojson.ts`, `utils.ts`, `defaults.ts` e tipos de
`types.ts` em módulos de serviço seguindo o padrão kebab-case.

#### 1.1 `src/services/geo/geo.types.ts` (novo)

Extrair de `src/types.ts`:
- `GeoItem` (alias de `RowItem`)
- `GeoJsonFeature`
- `GeoJsonFeatureCollection`
- `PointCoordinates` (= `[number, number]`)
- `PointGeometry`
- `GeolocationData`

#### 1.2 `src/services/geo/geo.ts` (novo)

Consolidar de múltiplas fontes:
- Constantes de `MapComponent.vue`: `GEO_SOURCE_ID`, `GEO_CLUSTER_LAYER_ID`,
  `GEO_POINT_LAYER_ID`, `GEO_ANIMATION_DURATION`, `GEO_FIT_BOUNDS_MAX_ZOOM`
- Constantes de `src/defaults.ts`: `DEFAULT_MAP_CENTER`, `DEFAULT_MAP_ZOOM`
- Função `resolveItemCoordinates` de `src/geojson.ts` → renomear para `getItemCoordinates`

#### 1.3 `src/services/geo/index.ts` (novo)

Barrel re-exports.

#### 1.4 `src/services/table/table.types.ts` (novo)

Extrair de `src/types.ts`:
- `Header` (`{ text: string; value: string }`)
- Novo `ResolvedHeader` (extends `Header` com `sortable`, `width`, `align`)

#### 1.5 `src/services/table/index.ts` (novo)

Barrel re-exports.

#### 1.6 `src/services/value-formatter/value-formatter.ts` (novo)

Consolidar:
- `serializeFieldValue` de `src/utils.ts` → renomear para `serializeValue`
- `resolveTitleFromTemplate` de `src/geojson.ts` → renomear para `resolveFieldTemplate`

#### 1.7 `src/services/value-formatter/index.ts` (novo)

Barrel re-exports.

---

### Fase 2 — Criar mocks centralizados

#### 2.1 `src/mocks/directus-mocks.ts` (novo)

Baseado no padrão do `feat/task-002-sidarta`, adaptado para os componentes do
`feat/task-004`:
- `mockGeoItems` — dados geolocalizados de exemplo
- `mockHeaders` — cabeçalhos de tabela
- `DirectusMockComponents` — stubs Vue dos componentes Directus
  (v-button, v-icon, v-info, v-progress-circular, v-detail, v-select, v-checkbox,
  v-collection-field-template, v-table, v-dialog, v-card, v-card-title, v-card-text,
  v-card-actions, v-input)
- `registerDirectusMockComponents(app)` — registra stubs globalmente
- `createMockApi()` — mock da API do Directus
- `createMockStores()` — mock dos stores
- `tooltipDirective` — diretiva tooltip mock
- Estilos CSS dos mocks

Substitui `src/test-utils.ts`.

---

### Fase 3 — Restriuturar componentes em subdiretórios storytype

Para **cada componente**, o padrão é:
```
kebab-case-nome/
├── NomeComponente.types.ts    # interface { models, props, emits }
├── NomeComponente.mock.ts     # generateMockData()
├── NomeComponente.test.ts     # testes (renomeado de .spec.ts)
├── NomeComponente.stories.ts  # stories (se existia)
├── NomeComponente.vue         # componente (com imports atualizados)
└── index.ts                   # barrel re-exports
```

#### 3.1 `src/components/atoms/delete-action/`

| Arquivo origem | Arquivo destino | Ação |
|---|---|---|
| `atoms/DeleteAction.vue` | `atoms/delete-action/DeleteAction.vue` | Mover + atualizar imports |
| `atoms/DeleteAction.spec.ts` | `atoms/delete-action/DeleteAction.test.ts` | Renomear + atualizar imports |
| — | `atoms/delete-action/DeleteAction.types.ts` | Criar |
| — | `atoms/delete-action/DeleteAction.mock.ts` | Criar |
| — | `atoms/delete-action/index.ts` | Criar |

**DeleteAction.types.ts:**
```ts
export interface DeleteActionProps {
  selectedItems: GeoItem[];
  deleteSelectedItems: () => Promise<void>;
}
export interface DeleteActionEmits {}
export interface DeleteActionModels {}
```

**DeleteAction.mock.ts:**
```ts
export const generateMockData = () => ({
  props: {
    selectedItems: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
    deleteSelectedItems: vi.fn().mockResolvedValue(undefined),
  },
  models: {},
  emits: {},
});
```

#### 3.2 `src/components/atoms/value-cell/` (NOVO)

Extrair a lógica de serialização inline do `TableComponent` em um componente atômico.

| Arquivo | Ação |
|---|---|
| `atoms/value-cell/ValueCell.vue` | Criar — usa `serializeValue` de `services/value-formatter` |
| `atoms/value-cell/ValueCell.types.ts` | Criar — `{ value: unknown }` |
| `atoms/value-cell/ValueCell.mock.ts` | Criar |
| `atoms/value-cell/ValueCell.test.ts` | Criar |
| `atoms/value-cell/ValueCell.stories.ts` | Criar |
| `atoms/value-cell/index.ts` | Criar |

**ValueCell.vue:**
```vue
<template>
  <span class="value-cell">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { serializeValue } from '../../../services/value-formatter/index.js';
import type { ValueCellProps } from './ValueCell.types';

const props = defineProps<ValueCellProps>();
const text = computed(() => serializeValue(props.value));
</script>
```

#### 3.3 `src/components/molecules/map-toolbar/` (NOVO)

Extrair o botão de reset do `MapComponent.vue`.

| Arquivo | Ação |
|---|---|
| `molecules/map-toolbar/MapToolbar.vue` | Criar — botão de reset do mapa |
| `molecules/map-toolbar/MapToolbar.types.ts` | Criar — emits `{ reset: [] }` |
| `molecules/map-toolbar/MapToolbar.mock.ts` | Criar |
| `molecules/map-toolbar/MapToolbar.test.ts` | Criar |
| `molecules/map-toolbar/MapToolbar.stories.ts` | Criar |
| `molecules/map-toolbar/index.ts` | Criar |

**MapToolbar.vue:**
```vue
<template>
  <v-button v-tooltip="'Reset view'" class="reset-map-btn" icon rounded @click="emit('reset')">
    <v-icon name="zoom_out_map" />
  </v-button>
</template>

<script setup lang="ts">
import type { MapToolbarEmits } from './MapToolbar.types';
const emit = defineEmits<MapToolbarEmits>();
</script>
```

#### 3.4 `src/components/molecules/mapgrid-options/`

| Arquivo origem | Arquivo destino | Ação |
|---|---|---|
| `molecules/MapGridOptions.vue` | `molecules/mapgrid-options/MapgridOptions.vue` | Mover + renomear + atualizar imports |
| `molecules/MapGridOptions.spec.ts` | `molecules/mapgrid-options/MapgridOptions.test.ts` | Renomear + atualizar imports |
| `molecules/MapGridOptions.stories.ts` | `molecules/mapgrid-options/MapgridOptions.stories.ts` | Mover + atualizar imports |
| — | `molecules/mapgrid-options/MapgridOptions.types.ts` | Criar |
| — | `molecules/mapgrid-options/MapgridOptions.mock.ts` | Criar |
| — | `molecules/mapgrid-options/index.ts` | Criar |

#### 3.5 `src/components/organisms/map-component/`

| Arquivo origem | Arquivo destino | Ação |
|---|---|---|
| `organisms/MapComponent.vue` | `organisms/map-component/MapComponent.vue` | Mover + atualizar imports (usar MapToolbar, services) |
| `organisms/MapComponent.spec.ts` | `organisms/map-component/MapComponent.test.ts` | Renomear + atualizar imports (usar mocks/) |
| `organisms/MapComponent.stories.ts` | `organisms/map-component/MapComponent.stories.ts` | Mover + atualizar imports |
| — | `organisms/map-component/MapComponent.types.ts` | Criar — props com centerLng, centerLat, initialZoom |
| — | `organisms/map-component/MapComponent.mock.ts` | Criar |
| — | `organisms/map-component/index.ts` | Criar |

**MapComponent.types.ts** (diferente do task-002-sidarta — inclui props extras):
```ts
import type { GeoItem } from '../../../services/geo/geo.types.js';

export interface MapComponentProps {
  items: GeoItem[];
  geolocation: string;
  title: string;
  zoomOnClick?: boolean;
  centerLng?: number;
  centerLat?: number;
  initialZoom?: number;
}

export interface MapComponentEmits {
  'select-item': [id: string | number];
}

export interface MapComponentModels {}
```

#### 3.6 `src/components/organisms/table-component/`

| Arquivo origem | Arquivo destino | Ação |
|---|---|---|
| `organisms/TableComponent.vue` | `organisms/table-component/TableComponent.vue` | Mover + atualizar imports (usar ValueCell, services) |
| `organisms/TableComponent.spec.ts` | `organisms/table-component/TableComponent.test.ts` | Renomear + atualizar imports |
| `organisms/TableComponent.stories.ts` | `organisms/table-component/TableComponent.stories.ts` | Mover + atualizar imports |
| — | `organisms/table-component/TableComponent.types.ts` | Criar — inclui selectedItems e v-model |
| — | `organisms/table-component/TableComponent.mock.ts` | Criar |
| — | `organisms/table-component/index.ts` | Criar |

**TableComponent.types.ts** (diferente do task-002-sidarta — inclui selectedItems):
```ts
import type { GeoItem } from '../../../services/geo/geo.types.js';
import type { Header } from '../../../services/table/table.types.js';

export interface TableComponentProps {
  items: GeoItem[];
  headers: Header[];
  collection: string;
  selectedItems: GeoItem[];
}

export interface TableComponentEmits {
  'focus-on-item': [item: GeoItem];
  'edit-item': [item: GeoItem];
  'update:selectedItems': [items: GeoItem[]];
}

export interface TableComponentModels {}
```

#### 3.7 `src/components/templates/mapgrid-layout/`

| Arquivo origem | Arquivo destino | Ação |
|---|---|---|
| `templates/MapGridLayout.vue` | `templates/mapgrid-layout/MapgridLayout.vue` | Mover + atualizar imports |
| `templates/Layout.spec.ts` | `templates/mapgrid-layout/MapgridLayout.test.ts` | Renomear + atualizar imports |
| `templates/MapGridLayout.stories.ts` | `templates/mapgrid-layout/MapgridLayout.stories.ts` | Mover + atualizar imports |
| — | `templates/mapgrid-layout/MapgridLayout.types.ts` | Criar — props completas do layout |
| — | `templates/mapgrid-layout/MapgridLayout.mock.ts` | Criar |
| — | `templates/mapgrid-layout/index.ts` | Criar |

**MapgridLayout.types.ts** (diferente do task-002-sidarta — inclui selectedItems, mapCenter, mapZoom):
```ts
import type { GeoItem } from '../../../services/geo/geo.types.js';

export interface MapgridLayoutProps {
  items: GeoItem[];
  loading?: boolean;
  collection: string;
  title?: string;
  geolocation?: string;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
  zoomOnClick?: boolean;
  selectedItems: GeoItem[];
}

export interface MapgridLayoutEmits {
  'update:selectedItems': [items: GeoItem[]];
}

export interface MapgridLayoutModels {}
```

#### 3.8 `src/components/pages/README.md` (novo)

Documentação do padrão de páginas no Atomic Design.

---

### Fase 4 — Atualizar arquivos root

#### 4.1 `src/types.ts` (simplificar)

Manter **apenas**:
```ts
import type { Filter } from '@directus/types';

export interface LayoutOptions {
  title?: string;
  geolocation?: string;
  zoomOnClick?: boolean;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
  coluna1?: string;
  coluna2?: string;
  coluna3?: string;
  coluna4?: string;
  coluna5?: string;
}

export interface LayoutQuery {
  fields: string[];
  limit: number;
  filter?: Filter;
  page: number;
  search?: string;
  sort?: string[];
}
```

Remover: `RowItem`, `GeoItem`, `Header`, `PointCoordinates`, `PointGeometry`,
`GeoJsonFeature`, `GeoJsonFeatureCollection`, `GeolocationData`.

#### 4.2 `src/index.ts` (atualizar imports)

| Import antigo | Import novo |
|---|---|
| `./components/atoms/DeleteAction.vue` | `./components/atoms/delete-action/DeleteAction.vue` |
| `./components/molecules/MapGridOptions.vue` | `./components/molecules/mapgrid-options/MapgridOptions.vue` |
| `./components/templates/MapGridLayout.vue` | `./components/templates/mapgrid-layout/MapgridLayout.vue` |
| `./defaults.js` | `./services/geo/index.js` |
| `./types.js` (RowItem) | `./services/geo/index.js` (GeoItem) |

#### 4.3 `src/components/index.ts` (atualizar)

```ts
export { default as DeleteAction } from './atoms/delete-action/DeleteAction.vue';
export { default as ValueCell } from './atoms/value-cell/ValueCell.vue';
export { default as MapToolbar } from './molecules/map-toolbar/MapToolbar.vue';
export { default as MapgridOptions } from './molecules/mapgrid-options/MapgridOptions.vue';
export { default as MapComponent } from './organisms/map-component/MapComponent.vue';
export { default as TableComponent } from './organisms/table-component/TableComponent.vue';
export { default as MapgridLayout } from './templates/mapgrid-layout/MapgridLayout.vue';
```

#### 4.4 `src/shims.d.ts` (manter como está)

---

### Fase 5 — Remover arquivos antigos

| Arquivo | Motivo |
|---|---|
| `src/defaults.ts` | Movido para `services/geo/geo.ts` |
| `src/geojson.ts` | Dividido entre `services/geo/` e `services/value-formatter/` |
| `src/utils.ts` | Movido para `services/value-formatter/` |
| `src/test-utils.ts` | Substituído por `mocks/directus-mocks.ts` |
| `src/components/atoms/DeleteAction.vue` | Movido para subdiretório |
| `src/components/atoms/DeleteAction.spec.ts` | Movido como `.test.ts` |
| `src/components/molecules/MapGridOptions.vue` | Movido como `MapgridOptions.vue` |
| `src/components/molecules/MapGridOptions.spec.ts` | Movido como `.test.ts` |
| `src/components/molecules/MapGridOptions.stories.ts` | Movido para subdiretório |
| `src/components/organisms/MapComponent.vue` | Movido para subdiretório |
| `src/components/organisms/MapComponent.spec.ts` | Movido como `.test.ts` |
| `src/components/organisms/MapComponent.stories.ts` | Movido para subdiretório |
| `src/components/organisms/TableComponent.vue` | Movido para subdiretório |
| `src/components/organisms/TableComponent.spec.ts` | Movido como `.test.ts` |
| `src/components/organisms/TableComponent.stories.ts` | Movido para subdiretório |
| `src/components/templates/MapGridLayout.vue` | Movido como `MapgridLayout.vue` |
| `src/components/templates/Layout.spec.ts` | Movido como `.test.ts` |
| `src/components/templates/MapGridLayout.stories.ts` | Movido para subdiretório |

---

### Fase 6 — Validação

| Comando | Esperado |
|---|---|
| `pnpm lint` | 0 erros |
| `pnpm typecheck` | 0 erros (incluindo tsconfig.tests.json) |
| `pnpm test` | 13+ testes passando |
| `pnpm build` | Build sem erro |

---

## Mapa de Dependências Atualizado

```
src/index.ts
  → components/atoms/delete-action/DeleteAction.vue
  → components/molecules/mapgrid-options/MapgridOptions.vue
  → components/templates/mapgrid-layout/MapgridLayout.vue
  → services/geo/index.js
  → types.js (LayoutOptions, LayoutQuery)

templates/mapgrid-layout/MapgridLayout.vue
  → organisms/map-component/MapComponent.vue
  → organisms/table-component/TableComponent.vue
  → types.js

organisms/map-component/MapComponent.vue
  → molecules/map-toolbar/MapToolbar.vue
  → services/geo/index.js
  → services/value-formatter/index.js

organisms/table-component/TableComponent.vue
  → atoms/value-cell/ValueCell.vue
  → services/table/index.js
  → services/value-formatter/index.js

molecules/mapgrid-options/MapgridOptions.vue
  → types.js (LayoutOptions)

atoms/delete-action/DeleteAction.vue
  → services/geo/index.js (GeoItem)

atoms/value-cell/ValueCell.vue
  → services/value-formatter/index.js
```

---

## Ordem de Execução

1. Criar `src/services/` (geo, table, value-formatter) — 7 arquivos
2. Criar `src/mocks/directus-mocks.ts` — 1 arquivo
3. Criar `atoms/value-cell/` — 6 arquivos (novo componente)
4. Criar `molecules/map-toolbar/` — 6 arquivos (novo componente)
5. Mover `atoms/DeleteAction` → `atoms/delete-action/` — 5 arquivos
6. Mover `molecules/MapGridOptions` → `molecules/mapgrid-options/` — 6 arquivos
7. Mover `organisms/MapComponent` → `organisms/map-component/` — 7 arquivos (refatorar com MapToolbar + services)
8. Mover `organisms/TableComponent` → `organisms/table-component/` — 7 arquivos (refatorar com ValueCell + services)
9. Mover `templates/MapGridLayout` → `templates/mapgrid-layout/` — 7 arquivos
10. Atualizar `src/types.ts` (simplificar)
11. Atualizar `src/index.ts` (imports)
12. Atualizar `src/components/index.ts` (barrel)
13. Criar `src/components/pages/README.md`
14. Remover arquivos antigos (18 arquivos)
15. Rodar validação: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

---

## Resumo de Mudanças

| Categoria | Qtd arquivos |
|---|---|
| Novos (services + mocks + components) | ~50 |
| Removidos | ~18 |
| Atualizados (imports) | ~5 |
| **Total de alterações** | **~73** |

---

## Riscos e Considerações

- **Imports quebrados:** Mover ~30 arquivos altera paths. Validar build após cada fase.
- **Compatibilidade:** As funcionalidades existentes (delete, auto-detect, map center/zoom,
  E2E) não devem ser alteradas — apenas os caminhos de import.
- **Testes:** Os 13 testes unitários devem continuar passando após a movimentação.
- **MapComponent split:** O MapToolbar é extraído do MapComponent. O MapComponent passa a
  importar o MapToolbar como subcomponente.
- **TableComponent split:** O ValueCell é extraído do TableComponent. O TableComponent passa
  a usar o ValueCell para renderizar células.
- **Tipos divergentes:** Os `.types.ts` do feat/task-004 terão props diferentes do
  feat/task-002-sidarta (incluem centerLng, centerLat, initialZoom, selectedItems, etc.).

---

## Critérios de Aceite

- [ ] Subdiretórios kebab-case com storytype completo em todos os componentes
- [ ] Camada de services (geo/, table/, value-formatter/) criada
- [ ] Mocks centralizados (directus-mocks.ts) criados
- [ ] Componentes ValueCell e MapToolbar extraídos
- [ ] Arquivos .types.ts com interface { models, props, emits } por componente
- [ ] `pnpm lint` — 0 erros
- [ ] `pnpm typecheck` — 0 erros
- [ ] `pnpm test` — todos os testes passando
- [ ] `pnpm build` — build sem erro
- [ ] Funcionalidades preservadas: delete, auto-detect, map center/zoom, E2E
- [ ] Arquivos antigos removidos
