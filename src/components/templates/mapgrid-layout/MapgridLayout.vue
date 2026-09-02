<template>
  <div class="mapgrid-layout">
    <v-info v-if="loading" icon="refresh" title="Loading..." center>
      <template #append>
        <v-progress-circular indeterminate />
      </template>
    </v-info>

    <v-info v-else-if="items.length === 0" icon="map" title="No items found" center />

    <div v-else class="mapgrid-container">
      <MapComponent
        ref="mapComponent"
        :items="items"
        :geolocation="geolocation ?? ''"
        :title="title ?? ''"
        :zoom-on-click="zoomOnClick"
        :center-lng="mapCenterLng"
        :center-lat="mapCenterLat"
        :initial-zoom="mapZoom"
        @select-item="handleSelectItem"
      />
      <TableComponent
        ref="tableComponent"
        :items="items"
        :headers="headers"
        :collection="collection"
        :selected-items="selectedItems"
        @update:selected-items="selectedItems = $event"
        @focus-on-item="handleFocusOnItem"
        @edit-item="editItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSync } from '@directus/extensions-sdk';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { GeoItem } from '../../../services/geo/index.js';
import type { Header } from '../../../services/table/index.js';
import MapComponent from '../../organisms/map-component/MapComponent.vue';
import TableComponent from '../../organisms/table-component/TableComponent.vue';
import type { MapgridLayoutEmits, MapgridLayoutProps } from './MapgridLayout.types';

const props = defineProps<MapgridLayoutProps>();

const emit = defineEmits<MapgridLayoutEmits>();

const router = useRouter();
const mapComponent = ref<InstanceType<typeof MapComponent> | null>(null);
const tableComponent = ref<InstanceType<typeof TableComponent> | null>(null);

const selectedItems = useSync(props, 'selectedItems', emit);

const headers = computed<Header[]>(() => {
  const columns = [
    props.coluna1,
    props.coluna2,
    props.coluna3,
    props.coluna4,
    props.coluna5,
  ].filter(Boolean) as string[];

  return columns.map((column) => ({ text: column, value: column }));
});

const handleFocusOnItem = (item: GeoItem): void => {
  mapComponent.value?.focusOnItem(item);
};

const handleSelectItem = (id: string | number): void => {
  tableComponent.value?.selectItem(id);
};

const editItem = (item: GeoItem): void => {
  router.push(`/content/${props.collection}/${item.id}`);
};
</script>

<style scoped>
.mapgrid-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  position: relative;
  padding: var(--content-padding);
  padding-top: 0;
  padding-bottom: var(--content-padding-bottom);
}

.mapgrid-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--content-padding);
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  overflow: hidden;
}

.mapgrid-container :deep(.map-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}

.mapgrid-container :deep(.table-container) {
  flex: 0 0 40%;
  min-height: 0;
}
</style>
