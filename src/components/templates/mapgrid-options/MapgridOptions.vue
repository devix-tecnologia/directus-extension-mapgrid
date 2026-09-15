<template>
  <v-detail icon="info" :label="t('optionPopup')">
    <div class="field">
      <v-collection-field-template v-model="title" :collection="collection" />
    </div>
  </v-detail>

  <v-detail icon="place" :label="t('optionGeolocation')">
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

  <v-detail icon="map" :label="t('optionMapCenter')">
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

  <v-detail icon="zoom_in" :label="t('optionZoomOnClick')">
    <div class="field">
      <v-checkbox
        v-model="zoomOnClick"
        :label="t('optionZoomOnClickLabel')"
      />
    </div>
  </v-detail>

  <v-detail icon="view_column" :label="t('optionColumns')">
    <div class="field-group">
      <div v-for="field in selectedFields" :key="field" class="chosen-field" :data-field="field">
        <span class="chosen-field__name">{{ field }}</span>
        <button type="button" class="chosen-field__remove" @click="removeField(field)">
          <v-icon name="close" small />
        </button>
      </div>

      <p v-if="selectedFields.length === 0" class="chosen-field__empty">
        {{ t('optionColumnsEmpty') }}
      </p>

      <v-menu placement="bottom-start" show-arrow>
        <template #activator="{ toggle }">
          <v-button secondary small @click="toggle">
            <v-icon name="add" small />
            {{ t('optionColumnsAdd') }}
          </v-button>
        </template>
        <v-field-list
          :collection="collection"
          :disabled-fields="selectedFields"
          @add="addField"
        />
      </v-menu>
    </div>
  </v-detail>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

/**
 * The chosen columns, in order. A list rather than five numbered slots: the
 * grid has no reason to cap at five, and the order is the user's.
 */
const selectedFields = computed<string[]>(() => props.fields ?? []);

/**
 * `v-field-list` emits the keys it collected. Adding one that is already there
 * would draw the same column twice, so a repeat is simply ignored — the picker
 * already greys those out via `disabled-fields`, and this guards the case where
 * it does not.
 */
const addField = (added: string[] | string): void => {
  const keys = Array.isArray(added) ? added : [added];
  const fresh = keys.filter((key) => key !== '' && !selectedFields.value.includes(key));
  if (fresh.length === 0) return;

  emit('update:fields', [...selectedFields.value, ...fresh]);
};

const removeField = (field: string): void => {
  emit(
    'update:fields',
    selectedFields.value.filter((candidate) => candidate !== field)
  );
};

/**
 * The fields that can hold a point. They come from the prop, not from a
 * `useCollection` of its own: the layout already resolved the collection once,
 * and fetching it again here was a second source of truth that could disagree
 * with the first.
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
