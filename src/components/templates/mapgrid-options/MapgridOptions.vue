<template>
  <!--
    SPIKE v8 — DESCARTAVEL. A prova do desenho.

    Este painel NAO cria wrapper nenhum: ele recebe `embeddedState` como prop,
    vindo do `setup()` de src/index.ts — o mesmo estado que o componente do
    layout desenha. Se o painel de opcoes do tabular montar aqui e reagir, o
    problema de "painel e layout sao irmaos" acabou.
  -->
  <v-detail icon="science" label="SPIKE v8 — opcoes do tabular">
    <div class="spike-opts">
      <p :data-spike-panel="spikePanelReport">{{ spikePanelReport }}</p>
      <component
        :is="embeddedOptionsComponent"
        v-if="embeddedOptionsComponent && spikeHasState"
        v-bind="embeddedState"
      />
    </div>
  </v-detail>

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

</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { MapgridOptionsEmits, MapgridOptionsProps } from './MapgridOptions.types';

const props = defineProps<
  MapgridOptionsProps & {
    embeddedState?: Record<string, unknown>;
    embeddedOptionsComponent?: unknown;
  }
>();

/* ---- SPIKE v8 — DESCARTAVEL ---- */
const spikeHasState = computed(() => Object.keys(props.embeddedState ?? {}).length > 0);
const spikePanelReport = computed(() => {
  const keys = Object.keys(props.embeddedState ?? {}).length;
  const comp = props.embeddedOptionsComponent ? 'sim' : 'nao';
  return `estado chegou ao painel: ${keys} chaves · slots.options: ${comp}`;
});
/* ---- fim do SPIKE v8 ---- */

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
</style>
