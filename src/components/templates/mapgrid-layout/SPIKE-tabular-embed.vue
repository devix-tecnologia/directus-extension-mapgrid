<!--
  SPIKE — DESCARTAVEL. Nao faz parte da extensao.

  v1: da para embutir o layout tabular? (da)
  v2: ele e o mapa convivem na mesma tela? (convivem, e o clique na linha pode
      deixar de navegar)
  v3: isto vale so para o tabular, ou para **qualquer layout** do Directus?

  A v3 troca o layout embutido em tempo de execucao. Se `cards` entrar no lugar
  de `tabular` sem mudar mais nada, entao o que o spike descobriu nao e sobre a
  grade: e sobre poder pendurar qualquer layout do Directus ao lado do mapa.

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike-layout">
    <div class="spike-bar">
      <button
        v-for="id in LAYOUT_IDS"
        :key="id"
        type="button"
        :class="{ on: id === layoutId }"
        :data-layout="id"
        @click="layoutId = id"
      >
        {{ id }}
      </button>
      <span class="spike-note">embutido: <b>{{ layoutId }}</b></span>
    </div>

    <component :is="layoutWrapper" v-if="layoutWrapper" v-bind="wrapperProps">
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
              :is="embeddedComp"
              v-if="embeddedComp"
              v-bind="{ ...layoutState, onRowClick: handleRowClick }"
            />
            <p v-else>sem component para {{ layoutId }}</p>
          </div>
        </div>

        <p class="spike-status" :data-layout-keys="Object.keys(layoutState).length">
          <b>{{ layoutId }}</b> · chaves do layoutState:
          <b>{{ Object.keys(layoutState).length }}</b> · itens dele:
          <b>{{ asItems(layoutState.items).length }}</b> · itens do nosso useItems:
          <b>{{ items?.length ?? 0 }}</b> · ultimo clique: <b>{{ lastClick }}</b>
        </p>
      </template>
    </component>

    <p v-else class="spike-status">sem layoutWrapper para {{ layoutId }}</p>
  </div>
</template>

<script setup lang="ts">
import * as sdk from '@directus/extensions-sdk';
import type { Component } from 'vue';
import { computed, ref } from 'vue';
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

const LAYOUT_IDS = ['tabular', 'cards', 'calendar', 'kanban'] as const;

/*
 * Reativo de proposito: `useLayout` devolve um computed que re-resolve quando o
 * id muda, entao trocar de layout nao exige remontar nada nem rebuildar.
 */
const layoutId = ref<string>('tabular');

const extensions = typeof anySdk.useExtensions === 'function' ? anySdk.useExtensions() : null;

const embeddedComp = computed<Component | null>(() => {
  const registered = extensions?.layouts?.value ?? [];
  return registered.find((l: { id: string }) => l.id === layoutId.value)?.component ?? null;
});

const layoutWrapper =
  typeof anySdk.useLayout === 'function' ? anySdk.useLayout(layoutId).layoutWrapper : null;

const mapRef = ref<InstanceType<typeof MapComponent> | null>(null);
const lastClick = ref('(nenhum)');

const asItems = (value: unknown): GeoItem[] => (Array.isArray(value) ? (value as GeoItem[]) : []);

const wrapperProps = computed(() => ({
  collection: props.collection,
  selection: [],
  layoutOptions: {},
  layoutQuery: {},
  filter: null,
  search: null,
}));

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
.spike-bar {
  flex: 0 0 auto;
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  font-family: monospace;
  font-size: 12px;
}
.spike-bar button {
  font-family: inherit;
  padding: 3px 10px;
  cursor: pointer;
  border: 1px solid #c00;
  background: transparent;
  border-radius: 4px;
}
.spike-bar button.on {
  background: #c00;
  color: #fff;
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
