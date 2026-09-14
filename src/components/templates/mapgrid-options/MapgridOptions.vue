<template>
  <v-detail icon="info" :header="t('optionPopup')">
    <div class="field">
      <v-collection-field-template v-model="title" :collection="collection" />
    </div>
  </v-detail>

  <v-detail icon="place" :header="t('optionGeolocation')">
    <div class="field">
      <v-select
        v-model="geolocation"
        :collection="collection"
        :items="[{ name: t('optionNone'), field: null }, ...geolocationFields]"
        item-text="name"
        item-value="field"
        :placeholder="t('optionGeolocationPlaceholder')"
        :show-deselect="true"
      />
    </div>
  </v-detail>

  <v-detail icon="map" :header="t('optionMapCenter')">
    <div class="field">
      <v-input
        v-model="centerLng"
        :label="t('optionLongitude')"
        placeholder="-47.9292"
        type="number"
        step="0.0001"
      />
    </div>
    <div class="field">
      <v-input
        v-model="centerLat"
        :label="t('optionLatitude')"
        placeholder="-15.7801"
        type="number"
        step="0.0001"
      />
    </div>
    <div class="field">
      <v-input
        v-model="mapZoom"
        :label="t('optionInitialZoom')"
        placeholder="4"
        type="number"
        min="1"
        max="20"
      />
    </div>
  </v-detail>

  <v-detail icon="zoom_in" :header="t('optionZoomOnClick')">
    <div class="field">
      <v-checkbox
        v-model="zoomOnClick"
        :label="t('optionZoomOnClickLabel')"
      />
    </div>
  </v-detail>

  <v-detail icon="view_column" :header="t('optionColumns')">
    <div class="field-group">
      <div v-for="(column, idx) in columnRefs" :key="idx" class="field">
        <v-select
          v-model="column.value"
          :collection="collection"
          :items="[{ name: t('optionNone'), field: null }, ...fieldsInCollection]"
          item-text="name"
          item-value="field"
          :placeholder="t('optionColumnPlaceholder', { number: idx + 1 })"
          :show-deselect="true"
        />
      </div>
    </div>
  </v-detail>
</template>

<script setup lang="ts">
import { computed, type WritableComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ColumnKey } from '../../../contract/index';
import { COLUMN_KEYS } from '../../../contract/index';
import { MESSAGES } from '../../../shared/messages';
import type { MapgridOptionsEmits, MapgridOptionsProps } from './MapgridOptions.types';

const props = defineProps<MapgridOptionsProps>();

const emit = defineEmits<MapgridOptionsEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const title = computed<string, string>({
  get: () => props.title ?? '',
  set: (value) => emit('update:title', value),
});

const geolocation = computed<string | null, string | null>({
  get: () => props.geolocation ?? null,
  set: (value) => emit('update:geolocation', value),
});

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const centerLng = computed<number | undefined, unknown>({
  get: () => props.mapCenterLng,
  set: (value) => {
    const parsed = toFiniteNumber(value);
    if (parsed !== undefined) emit('update:mapCenterLng', parsed);
  },
});

const centerLat = computed<number | undefined, unknown>({
  get: () => props.mapCenterLat,
  set: (value) => {
    const parsed = toFiniteNumber(value);
    if (parsed !== undefined) emit('update:mapCenterLat', parsed);
  },
});

const mapZoom = computed<number | undefined, unknown>({
  get: () => props.mapZoom,
  set: (value) => {
    const parsed = toFiniteNumber(value);
    if (parsed !== undefined) emit('update:mapZoom', parsed);
  },
});

const zoomOnClick = computed<boolean | undefined, unknown>({
  get: () => props.zoomOnClick,
  set: (value) => emit('update:zoomOnClick', Boolean(value)),
});

const setColumn = (key: ColumnKey, value: string | null): void => {
  if (key === 'coluna1') return void emit('update:coluna1', value);
  if (key === 'coluna2') return void emit('update:coluna2', value);
  if (key === 'coluna3') return void emit('update:coluna3', value);
  if (key === 'coluna4') return void emit('update:coluna4', value);
  emit('update:coluna5', value);
};

const columnRefs: WritableComputedRef<string | null>[] = COLUMN_KEYS.map((key) =>
  computed<string | null>({
    get: () => props[key] ?? null,
    set: (value) => setColumn(key, value),
  })
);

/**
 * Os campos que podem guardar um ponto. Vêm da prop, e não de um `useCollection`
 * próprio: o layout já resolveu a coleção uma vez, e buscá-la de novo aqui era
 * uma segunda fonte da verdade que podia discordar da primeira.
 */
const geolocationFields = computed(() =>
  props.fieldsInCollection.filter((field) => field.meta?.interface === 'map')
);
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
