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
        :geolocation="geolocation"
        :title="title"
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSync } from '@directus/extensions-sdk';
import MapComponent from './components/MapComponent.vue';
import TableComponent from './components/TableComponent.vue';
import type { RowItem, Header } from './types.js';

const props = defineProps<{
  items: RowItem[];
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
  deleteItems?: (ids: (string | number)[]) => Promise<void>;
  selectedItems: RowItem[];
  deleteSelectedItems?: () => Promise<void>;
}>();

const emit = defineEmits<{
  'update:selectedItems': [items: RowItem[]];
}>();

const router = useRouter();
const mapComponent = ref<InstanceType<typeof MapComponent> | null>(null);
const tableComponent = ref<InstanceType<typeof TableComponent> | null>(null);

const selectedItems = useSync(props, 'selectedItems', emit);

const headers = computed<Header[]>(() => {
  const columns = [props.coluna1, props.coluna2, props.coluna3, props.coluna4, props.coluna5].filter(
    Boolean,
  ) as string[];

  return columns.map((column) => ({ text: column, value: column }));
});

const handleFocusOnItem = (item: RowItem): void => {
  mapComponent.value?.focusOnItem(item);
};

const handleSelectItem = (id: string | number): void => {
  tableComponent.value?.selectItem(id);
};

const editItem = (item: RowItem): void => {
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
</style>
