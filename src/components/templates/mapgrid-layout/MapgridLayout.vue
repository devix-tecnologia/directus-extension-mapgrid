<template>
  <div class="mapgrid-layout">
    <v-info v-if="loading" icon="refresh" :title="t('loading')" center>
      <template #append>
        <v-progress-circular indeterminate />
      </template>
    </v-info>

    <v-info
      v-else-if="items.length === 0"
      icon="map"
      :title="t('noItems')"
      :subtitle="t('noItemsHint')"
      center
    />

    <div v-else class="mapgrid-container">
      <MapComponent
        ref="mapComponent"
        :items="items"
        :geolocation="geolocation ?? ''"
        :title="title ?? ''"
        :zoom-on-click="zoomOnClick"
        :map-center-lng="mapCenterLng"
        :map-center-lat="mapCenterLat"
        :map-zoom="mapZoom"
        @select-item="handleSelectItem"
      />
      <TableComponent
        ref="tableComponent"
        :items="items"
        :headers="headers"
        :collection="collection"
        :selected-items="selectedItems"
        :can-edit="canEdit"
        :can-delete="canDelete"
        @update:selected-items="selectedItems = $event"
        @focus-on-item="handleFocusOnItem"
        @edit-item="editItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GeoItem } from '../../../contract/index';
import { configuredColumns } from '../../../contract/index';
import type { Header } from '../../../services/table/index';
import { MESSAGES } from '../../../shared/messages';
import MapComponent from '../../organisms/map-component/MapComponent.vue';
import TableComponent from '../../organisms/table-component/TableComponent.vue';
import type { MapgridLayoutEmits, MapgridLayoutProps } from './MapgridLayout.types';

const props = withDefaults(defineProps<MapgridLayoutProps>(), {
  canEdit: true,
  canDelete: true,
});

const emit = defineEmits<MapgridLayoutEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const mapComponent = ref<InstanceType<typeof MapComponent> | null>(null);
const tableComponent = ref<InstanceType<typeof TableComponent> | null>(null);

/**
 * The selection lives in the layout, which is what hands it to the delete
 * action. This component only mirrors it, with a writable computed instead of
 * the Directus SDK's `useSync`: without that import the template no longer
 * depends on the host app, and mounts the same in Storybook, in a test and
 * inside Directus.
 */
const selectedItems = computed<GeoItem[]>({
  get: () => props.selectedItems,
  set: (items) => emit('update:selectedItems', items),
});

const headers = computed<Header[]>(() =>
  configuredColumns(props).map((column) => ({ text: column, value: column }))
);

const handleFocusOnItem = (item: GeoItem): void => {
  mapComponent.value?.focusOnItem(item);
};

const handleSelectItem = (id: string | number): void => {
  tableComponent.value?.selectItem(id);
};

const editItem = (item: GeoItem): void => {
  emit('edit-item', item);
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
