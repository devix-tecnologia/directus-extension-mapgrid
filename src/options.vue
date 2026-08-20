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

<script lang="ts">
import { defineComponent, toRefs, computed, ref, watch, type WritableComputedRef } from 'vue';
import { useCollection, useSync } from '@directus/extensions-sdk';
import type { LayoutOptions } from './types';

const COLUMN_KEYS = ['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5'] as const;

export default defineComponent({
  name: 'Options',
  props: {
    collection: { type: String, required: true },
    layoutOptions: { type: Object as () => LayoutOptions, required: true },
    fieldsInCollection: { type: Array, required: true },
    title: { type: String, default: '' },
    geolocation: { type: String, default: null },
    mapCenterLng: { type: Number, default: -47.9292 },
    mapCenterLat: { type: Number, default: -15.7801 },
    mapZoom: { type: Number, default: 4 },
    coluna1: { type: String, default: null },
    coluna2: { type: String, default: null },
    coluna3: { type: String, default: null },
    coluna4: { type: String, default: null },
    coluna5: { type: String, default: null },
    zoomOnClick: { type: Boolean, default: false },
  },
  emits: [
    'update:layoutOptions',
    'update:geolocation',
    'update:title',
    'update:mapCenterLng',
    'update:mapCenterLat',
    'update:mapZoom',
    'update:coluna1',
    'update:coluna2',
    'update:coluna3',
    'update:coluna4',
    'update:coluna5',
    'update:zoomOnClick',
  ],
  setup(props, { emit }) {
    const { collection: collectionKey } = toRefs(props);
    const collection = useCollection(collectionKey);

    const title = useSync(props, 'title', emit);
    const geolocation = useSync(props, 'geolocation', emit);

    const localCenterLng = ref(props.mapCenterLng);
    const localCenterLat = ref(props.mapCenterLat);
    const localMapZoom = ref(props.mapZoom);

    watch(() => props.mapCenterLng, (v) => { localCenterLng.value = v; });
    watch(() => props.mapCenterLat, (v) => { localCenterLat.value = v; });
    watch(() => props.mapZoom, (v) => { localMapZoom.value = v; });

    const columnRefs: WritableComputedRef<string | null>[] = COLUMN_KEYS.map((key) =>
      useSync(props, key, emit),
    );

    const localZoomOnClick = ref(props.zoomOnClick);

    watch(
      () => props.zoomOnClick,
      (newValue) => {
        localZoomOnClick.value = newValue;
      },
    );

    const geolocationFields = computed(() =>
      collection.fields.value.filter(
        (f: { meta?: { interface?: string } }) => f.meta?.interface === 'map',
      ),
    );

    return {
      geolocationFields,
      title,
      geolocation,
      localCenterLng,
      localCenterLat,
      localMapZoom,
      columnRefs,
      localZoomOnClick,
      emit,
    };
  },
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
