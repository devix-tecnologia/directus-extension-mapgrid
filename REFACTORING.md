# Refatoração UI - Integração com Componentes Directus

## Resumo

Integração visual da extensão MapGrid com o design system do Directus, utilizando componentes nativos e variáveis de tema para consistência com o Directus Studio.

## Componentes Refatorados

### 1. `options.vue`

- `v-detail` (accordion) agrupa seções: Popup Pin Map, Geolocation, Zoom on Table Click, Table Columns
- `v-select`, `v-checkbox`, `v-collection-field-template` mantidos (já eram componentes Diretus)
- Labels e `<div class="type-label">` manuais removidos — `v-detail` fornece header nativo
- 5 selects de coluna renderizados via `v-for` eliminando repetição de模板

### 2. `layout.vue`

- Classes renomeadas para `mapgrid-*` evitando conflito com namespace do Directus
- Container principal (`mapgrid-container`) com `border`, `border-radius` e `background` do tema
- Estado vazio com `v-info` quando `items.length === 0`
- Loading com `v-info` + `v-progress-circular` (já existente)

### 3. `TableComponent.vue`

- Scrollbar customizada com variáveis do tema (`--theme--background-subdued`, `--theme--foreground-subdued`)
- Seleção de linha mais sutil: fundo `--theme--primary-background` e texto `--theme--primary`
- Ícone edit com transição de opacidade no hover
- `v-table` com header `--theme--background-subdued`

### 4. `MapComponent.vue`

- Botão reset usando `var(--content-padding)` ao invés de valores fixos
- Border do mapa herdado do container pai
- Lógica de `focusOnItem` extraída em funções nomeadas: `flyToItem`, `panToVisibleArea`, `flashHighlightMarker`, `openPopupAt`

## Padrões TypeScript

- Todos os componentes `.vue` utilizam `<script setup lang="ts">` ou `<script lang="ts">`
- Interfaces explícitas para `GeoItem`, `RowItem`, `Header`, `GeoJsonFeature`
- Parâmetros e refs tipados — nenhum `any` explícito
- `options.vue`: colunas refatoradas com `COLUMN_KEYS` const e `WritableComputedRef[]`
- Zero comentários no código-fonte — nomes de funções e variáveis descrevem a intenção

## Funções Extraitas (MapComponent.vue)

| Função | Responsabilidade |
|---|---|
| `resolveThemePrimaryColor()` | Obtém cor primária do CSS theme |
| `resolveFieldTemplate()` | Renderiza template `{{field}}` com dados do item |
| `resolveFieldValue()` | Serializa valor de campo (string, array, geo, objeto) |
| `buildGeoJson()` | Gera FeatureCollection a partir dos items |
| `fitBoundsToItems()` | Ajusta bounds do mapa aos markers |
| `dismissAllPopups()` | Fecha todos os popups abertos |
| `createClusterLabelElement()` | Cria elemento SVG para label de cluster |
| `refreshClusterLabels()` | Atualiza markers de cluster no mapa |
| `openPopupAt()` | Abre popup em coordenadas |
| `flyToItem()` | Anima zoom até item |
| `panToVisibleArea()` | Move mapa para enquadrar ponto visível |
| `flashHighlightMarker()` | Destaque temporário no marcador |
| `registerMapEvents()` | Registra todos os eventos do mapa |

## Variáveis CSS do Directus Utilizadas

### Cores e Tema
- `--theme--background`, `--theme--background-subdued`, `--theme--background-accent`
- `--theme--primary`, `--theme--primary-background`
- `--theme--foreground`, `--theme--foreground-subdued`
- `--theme--border-color-subdued`, `--theme--border-radius`
- `--theme--elevation-2xl`

### Espaçamento
- `--content-padding`, `--content-padding-bottom`
- `--form-vertical-gap`, `--form-horizontal-gap`

### Transições
- `--transition-fast`, `--transition`
