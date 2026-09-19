<!--
  SPIKE — DESCARTAVEL. Nao faz parte da extensao.

  v1: da para embutir o layout tabular? (da)
  v2: ele e o mapa convivem? (sim, e no tabular o clique na linha pode ser nosso)
  v3: vale para outros layouts? (embutir sim; interceptar o clique nao — no cards
      o item e um link e navega)
  v4: a consulta e aproveitada? (nao: duas buscas, com campos e ordem diferentes)

  v5 — a pergunta que as quatro anteriores levantaram: **usar a base, nao o
  layout**. O `createLayoutWrapper` nao desenha nada, so chama o `setup()` do
  layout e entrega o resultado pelo slot. Entao da para consumir o `layoutState`
  e desenhar markup nosso, sem montar o componente deles.

  Se der certo, tres problemas caem de uma vez:
    - o clique volta a ser nosso, porque a linha e nossa
    - some a folga no topo, que era chrome deles
    - a consulta vira uma so, porque nos e que entregamos o `layoutQuery` — e
      podemos injetar nele o campo de geometria que o mapa precisa

  Duas coisas em teste aqui, e o `setup()` de `src/index.ts` teve o `useItems`
  removido de proposito, para a contagem de consultas ficar honesta:
    1. o `setup()` do tabular roda de pe sem o componente dele montado?
    2. o `render-display` — como ele formata celula — e alcancavel por extensao?

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike-layout">
    <div class="spike-bar">
      <span>v5 — logica deles, markup nosso</span>
      <span class="spike-note">render-display: <b>{{ hasRenderDisplay }}</b></span>
    </div>

    <component
      :is="layoutWrapper"
      v-if="layoutWrapper"
      v-bind="wrapperProps"
      @update:layoutQuery="onQueryChange"
    >
      <template #default="{ layoutState }">
        <div class="spike-split">
          <MapComponent
            ref="mapRef"
            :items="asItems(layoutState.items)"
            :geolocation="geolocation ?? ''"
            :title="title ?? ''"
            :zoom-on-click="zoomOnClick"
            :map-center-lng="mapCenterLng"
            :map-center-lat="mapCenterLat"
            :map-zoom="mapZoom"
          />

          <!-- markup nosso, alimentado pelo estado deles -->
          <div class="spike-grid">
            <table class="nossa-grade">
              <thead>
                <tr>
                  <th
                    v-for="header in headersOf(layoutState)"
                    :key="header.value"
                    :data-col="header.value"
                    @click="sortBy(layoutState, header.value)"
                  >
                    {{ header.text }}
                    <span v-if="sortOf(layoutState).by === header.value">
                      {{ sortOf(layoutState).desc ? '▼' : '▲' }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in asItems(layoutState.items)"
                  :key="item.id"
                  :data-row="item.id"
                  @click="focus(item)"
                >
                  <td v-for="header in headersOf(layoutState)" :key="header.value">
                    <render-display
                      v-if="hasRenderDisplay"
                      :value="item[header.value]"
                      :type="typeOf(layoutState, header.value)"
                      :collection="collection"
                      :field="header.value"
                    />
                    <span v-else>{{ item[header.value] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p class="spike-status">
          chaves: <b>{{ Object.keys(layoutState).length }}</b> · colunas:
          <b>{{ headersOf(layoutState).length }}</b> · itens dele:
          <b>{{ asItems(layoutState.items).length }}</b> · itens nossos:
          <b>{{ items?.length ?? 0 }}</b> · sort:
          <b>{{ sortOf(layoutState).by }}/{{ sortOf(layoutState).desc ? 'desc' : 'asc' }}</b> ·
          emits de layoutQuery: <b>{{ queryEmits }}</b> · clique: <b>{{ lastClick }}</b>
        </p>
      </template>
    </component>

    <p v-else class="spike-status">sem layoutWrapper</p>
  </div>
</template>

<script setup lang="ts">
import * as sdk from '@directus/extensions-sdk';
import { computed, getCurrentInstance, ref } from 'vue';
import type { GeoItem } from '../../../contract/index';
import MapComponent from '../../organisms/map-component/MapComponent.vue';

const props = defineProps<{
  collection: string;
  items?: GeoItem[];
  geolocation?: string;
  title?: string;
  zoomOnClick?: boolean;
  mapCenterLng?: number;
  mapCenterLat?: number;
  mapZoom?: number;
}>();

// biome-ignore lint/suspicious/noExplicitAny: spike descartavel
const anySdk = sdk as any;

interface LayoutHeader {
  text: string;
  value: string;
}
interface TableSortShape {
  by: string | null;
  desc: boolean;
}
type LayoutState = Record<string, unknown>;

const layoutId = ref('tabular');
const layoutWrapper =
  typeof anySdk.useLayout === 'function' ? anySdk.useLayout(layoutId).layoutWrapper : null;

/** O `render-display` esta entre os componentes globais que o app registra? */
const globalComponents = Object.keys(getCurrentInstance()?.appContext.components ?? {});
const hasRenderDisplay = globalComponents.includes('render-display');

const mapRef = ref<InstanceType<typeof MapComponent> | null>(null);
const lastClick = ref('(nenhum)');

const asItems = (value: unknown): GeoItem[] => (Array.isArray(value) ? (value as GeoItem[]) : []);

/**
 * O `layoutQuery` e prop nossa, entao o campo de geometria entra aqui — sem ele
 * o layout so pede o que exibe, e o mapa fica sem coordenada (foi o que a v4
 * flagrou no cards, que pedia `fields[]=id` e mais nada).
 */
/*
 * O `layoutQuery` tem de ser de mao dupla. Na primeira tentativa ele era um
 * objeto estatico, e a ordenacao nao pegava: o `onSortChange` deles escreve via
 * `useSync`, que **emite** `update:layoutQuery` — e emit que ninguem escuta some.
 * O estado voltava ao valor fixo no render seguinte.
 */
const liveQuery = ref<Record<string, unknown>>({
  fields: [...new Set(['name', 'status', props.geolocation].filter(Boolean))],
  sort: ['name'],
  limit: 25,
  page: 1,
});

const queryEmits = ref(0);
const onQueryChange = (next: Record<string, unknown>): void => {
  queryEmits.value += 1;
  liveQuery.value = next;
};

const wrapperProps = computed(() => ({
  collection: props.collection,
  selection: [],
  layoutOptions: {},
  layoutQuery: liveQuery.value,
  filter: null,
  search: null,
}));

const headersOf = (state: LayoutState): LayoutHeader[] => {
  const headers = state.tableHeaders;
  return Array.isArray(headers) ? (headers as LayoutHeader[]) : [];
};

const sortOf = (state: LayoutState): TableSortShape =>
  (state.tableSort as TableSortShape | undefined) ?? { by: null, desc: false };

const typeOf = (state: LayoutState, field: string): string => {
  const fields = state.fieldsInCollection;
  if (!Array.isArray(fields)) return 'string';
  const found = (fields as { field: string; type?: string }[]).find((f) => f.field === field);
  return found?.type ?? 'string';
};

/** A ordenacao e deles: chamamos o `onSortChange` que o `layoutState` entrega. */
const sortBy = (state: LayoutState, field: string): void => {
  const onSortChange = state.onSortChange;
  if (typeof onSortChange !== 'function') {
    lastClick.value = 'SEM onSortChange';
    return;
  }
  lastClick.value = `onSortChange(${field})`;
  const current = sortOf(state);
  (onSortChange as (sort: TableSortShape) => void)({
    by: field,
    desc: current.by === field ? !current.desc : false,
  });
};

/** O clique e nosso por construcao: a linha e nossa, nao ha nada a interceptar. */
const focus = (item: GeoItem): void => {
  lastClick.value = `item=${item.id}`;
  mapRef.value?.focusOnItem(item);
};
</script>

<style scoped>
.spike-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: var(--content-padding);
  padding-top: 0;
}
.spike-bar {
  flex: 0 0 auto;
  display: flex;
  gap: 12px;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 6px;
}
.spike-split {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  border: 2px dashed #090;
  overflow: hidden;
}
.spike-split :deep(.map-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}
.spike-grid {
  flex: 0 0 45%;
  min-height: 0;
  overflow: auto;
  border-top: 2px dashed #090;
}
.nossa-grade {
  width: 100%;
  border-collapse: collapse;
}
.nossa-grade th {
  text-align: left;
  padding: 8px 12px;
  cursor: pointer;
  background: var(--theme--background-subdued, #f4f5f7);
  border-bottom: 1px solid var(--theme--border-color-subdued, #e4e9f2);
  position: sticky;
  top: 0;
}
.nossa-grade td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--theme--border-color-subdued, #eee);
}
.nossa-grade tbody tr:hover {
  background: var(--theme--background-subdued, #f4f5f7);
  cursor: pointer;
}
.spike-status {
  flex: 0 0 auto;
  font-family: monospace;
  font-size: 12px;
}
</style>
