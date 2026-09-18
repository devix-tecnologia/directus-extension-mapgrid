<!--
  SPIKE — DESCARTAVEL. Nao faz parte da extensao.

  v1 respondeu "da para embutir o layout tabular?". Esta e a v2, que responde o
  que a v1 deixou sem medir: **o tabular e o mapa convivendo na mesma tela**.

  Tres coisas sob teste aqui:

  1. o tabular aguenta meia tela? ele foi escrito para ocupar tudo, e aqui divide
     espaco com o mapa
  2. o `onRowClick` do `layoutState` pode ser trocado pelo nosso, para o clique
     na linha enquadrar o marcador em vez de navegar para o item
  3. o mapa se alimenta do `items` que o proprio tabular buscou

  Sobre o item 3: o `setup()` em `src/index.ts` continua fazendo o `useItems`
  dele, entao aqui ainda ha dois fetches. O spike nao mexe nisso — ele so mostra
  que o mapa NAO precisa do nosso, comparando as duas contagens no rodape.

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike-layout">
    <details class="spike-report">
      <summary>relatorio do spike ({{ reportLines.length }} linhas)</summary>
      <pre>{{ report }}</pre>
    </details>

    <component :is="wrapperComp" v-if="wrapperComp" v-bind="wrapperProps">
      <template #default="{ layoutState }">
        <div class="spike-split">
          <MapComponent
            ref="mapRef"
            class="spike-map"
            :items="asItems(layoutState.items)"
            :geolocation="geolocation ?? ''"
            :title="title ?? ''"
            :zoom-on-click="zoomOnClick"
            :map-center-lng="mapCenterLng"
            :map-center-lat="mapCenterLat"
            :map-zoom="mapZoom"
          />

          <div class="spike-grid">
            <component
              :is="tabularComp"
              v-if="tabularComp"
              v-bind="{ ...layoutState, onRowClick: handleRowClick }"
            />
          </div>
        </div>

        <p class="spike-status">
          itens do tabular: <b>{{ asItems(layoutState.items).length }}</b> ·
          itens do nosso useItems: <b>{{ items?.length ?? 0 }}</b> · ultimo clique:
          <b>{{ lastClick }}</b>
        </p>
      </template>
    </component>

    <p v-else class="spike-status">sem layoutWrapper — ver relatorio</p>
  </div>
</template>

<script setup lang="ts">
import * as sdk from '@directus/extensions-sdk';
import type { Component } from 'vue';
import { computed, ref, shallowRef } from 'vue';
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

const reportLines: string[] = [];
const wrapperComp = shallowRef<Component | null>(null);
const tabularComp = shallowRef<Component | null>(null);
const mapRef = ref<InstanceType<typeof MapComponent> | null>(null);
const lastClick = ref('(nenhum)');

reportLines.push(`useExtensions: ${typeof anySdk.useExtensions}`);
reportLines.push(`useLayout: ${typeof anySdk.useLayout}`);

if (typeof anySdk.useExtensions === 'function') {
  const registered = anySdk.useExtensions().layouts?.value ?? [];
  reportLines.push(`layouts: ${registered.map((l: { id: string }) => l.id).join(', ')}`);
  tabularComp.value = registered.find((l: { id: string }) => l.id === 'tabular')?.component ?? null;
}

if (typeof anySdk.useLayout === 'function') {
  wrapperComp.value = anySdk.useLayout(ref('tabular')).layoutWrapper.value ?? null;
}

const report = reportLines.join('\n');

const asItems = (value: unknown): GeoItem[] => (Array.isArray(value) ? (value as GeoItem[]) : []);

const wrapperProps = computed(() => ({
  collection: props.collection,
  selection: [],
  layoutOptions: {},
  layoutQuery: {},
  filter: null,
  search: null,
}));

/**
 * O lance todo: sem isto o clique na linha navega para a tela do item, que
 * mataria a sincronia com o mapa — que e a razao de existir desta extensao.
 */
const handleRowClick = (payload: unknown): void => {
  const shape = payload && typeof payload === 'object' ? Object.keys(payload).join('+') : 'nao-obj';
  const item = (payload as { item?: GeoItem } | null)?.item;
  lastClick.value = `{${shape}} item=${item?.id ?? '?'}`;

  if (item) mapRef.value?.focusOnItem(item);
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
.spike-report {
  flex: 0 0 auto;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 8px;
}
.spike-split {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  border: 2px dashed #c00;
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
  border-top: 2px dashed #c00;
}
.spike-status {
  flex: 0 0 auto;
  font-family: monospace;
  font-size: 12px;
}
</style>
