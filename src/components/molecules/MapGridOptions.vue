<template>
  <v-detail icon="info" header="Popup Pin Map">
    <div class="field">
      <v-collection-field-template v-model="title" :collection="collection" />
    </div>
  </v-detail>

  <v-detail icon="place" header="Geolocation">
    <div class="field">
      <v-select
        v-model="geolocation"
        :collection="collection"
        :items="[{ name: '---', field: null }, ...geolocationFields]"
        item-text="name"
        item-value="field"
        placeholder="Select a geolocation field"
        :show-deselect="true"
      />
    </div>
  </v-detail>

  <v-detail icon="map" header="Map Center">
    <div class="field">
      <v-input
        v-model.number="localCenterLng"
        label="Longitude"
        placeholder="-47.9292"
        type="number"
        step="0.0001"
        @update:modelValue="emit('update:mapCenterLng', $event)"
      />
    </div>
    <div class="field">
      <v-input
        v-model.number="localCenterLat"
        label="Latitude"
        placeholder="-15.7801"
        type="number"
        step="0.0001"
        @update:modelValue="emit('update:mapCenterLat', $event)"
      />
    </div>
    <div class="field">
      <v-input
        v-model.number="localMapZoom"
        label="Initial Zoom"
        placeholder="4"
        type="number"
        min="1"
        max="20"
        @update:modelValue="emit('update:mapZoom', $event)"
      />
    </div>
  </v-detail>

  <v-detail icon="zoom_in" header="Zoom on Table Click">
    <div class="field">
      <v-checkbox
        v-model="localZoomOnClick"
        label="Zoom when clicking table items"
        @update:modelValue="emit('update:zoomOnClick', $event)"
      />
    </div>
  </v-detail>

  <v-detail icon="view_column" header="Table Columns">
    <div class="field-group">
      <div v-for="(column, idx) in columnRefs" :key="idx" class="field">
        <v-select
          v-model="column.value"
          :collection="collection"
          :items="[{ name: '---', field: null }, ...fieldsInCollection]"
          item-text="name"
          item-value="field"
          :placeholder="`Column ${idx + 1}`"
          :show-deselect="true"
        />
      </div>
    </div>
  </v-detail>
</template>

<script setup lang="ts">
import { useCollection, useSync } from '@directus/extensions-sdk';
import { computed, ref, toRefs, type WritableComputedRef, watch } from 'vue';
import type { LayoutOptions } from '../../types.js';

const COLUMN_KEYS = ['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5'] as const;

const props = defineProps<{
  collection: string;
  layoutOptions: LayoutOptions;
  fieldsInCollection: Array<{ name: string; field: string; meta?: { interface?: string } }>;
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
}>();

const emit = defineEmits<{
  'update:layoutOptions': [value: LayoutOptions];
  'update:geolocation': [value: string | null];
  'update:title': [value: string];
  'update:mapCenterLng': [value: number];
  'update:mapCenterLat': [value: number];
  'update:mapZoom': [value: number];
  'update:coluna1': [value: string | null];
  'update:coluna2': [value: string | null];
  'update:coluna3': [value: string | null];
  'update:coluna4': [value: string | null];
  'update:coluna5': [value: string | null];
  'update:zoomOnClick': [value: boolean];
}>();

const { collection: collectionKey } = toRefs(props);
const collection = useCollection(collectionKey);

const title = useSync(props, 'title', emit);
const geolocation = useSync(props, 'geolocation', emit);

const localCenterLng = ref(props.mapCenterLng);
const localCenterLat = ref(props.mapCenterLat);
const localMapZoom = ref(props.mapZoom);

watch(
  () => props.mapCenterLng,
  (v) => {
    localCenterLng.value = v;
  }
);
watch(
  () => props.mapCenterLat,
  (v) => {
    localCenterLat.value = v;
  }
);
watch(
  () => props.mapZoom,
  (v) => {
    localMapZoom.value = v;
  }
);

const columnRefs: WritableComputedRef<string | null>[] = COLUMN_KEYS.map((key) =>
  useSync(props, key, emit)
);

const localZoomOnClick = ref(props.zoomOnClick);

watch(
  () => props.zoomOnClick,
  (newValue) => {
    localZoomOnClick.value = newValue;
  }
);

const geolocationFields = computed(() => {
  const fields = collection.fields;
  if (!fields) return [];
  const fieldsArray = Array.isArray(fields) ? fields : Array.isArray(fields.value) ? fields.value : [];
  return fieldsArray.filter((f: any) => f.meta?.interface === 'map');
});
</script>

<style scoped>
.field {
  margin-top: var(--form-vertical-gap);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--form-vertical-gap);
  margin-top: var(--form-vertical-gap);
}
</style>
