<template>
  <!--
    SPIKE v6 — DESCARTAVEL. Da para compor a area de configuracao, trazendo o
    painel de opcoes do layout tabular para dentro do nosso?

    O `slots.options` dele e alcancavel pelo registro de layouts. O problema e
    que o painel de opcoes e o componente do layout sao IRMAOS na arvore: o
    `layoutState` que existe la dentro nao chega aqui. Para dar props ao painel
    deles, so instanciando outro wrapper — e outro wrapper e outro `setup()`,
    logo outra consulta. E o que este bloco mede.
  -->
  <v-detail icon="science" label="SPIKE — opcoes do tabular">
    <div class="spike-opts" :data-spike-options="spikeReport">
      <p>{{ spikeReport }}</p>
      <component :is="spikeWrapper" v-if="spikeWrapper" v-bind="spikeWrapperProps">
        <template #default="{ layoutState }">
          <div class="spike-opts__painel">
            <component :is="spikeOptionsComp" v-if="spikeOptionsComp" v-bind="layoutState" />
            <p v-else>sem component de options</p>
          </div>
        </template>
      </component>
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
import * as sdk from '@directus/extensions-sdk';
import { computed, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { MapgridOptionsEmits, MapgridOptionsProps } from './MapgridOptions.types';

const props = defineProps<MapgridOptionsProps>();

/* ---- SPIKE v6 — DESCARTAVEL ---- */
// biome-ignore lint/suspicious/noExplicitAny: spike
const anySdk = sdk as any;

const spikeOptionsComp = shallowRef<unknown>(null);
const spikeWrapper = shallowRef<unknown>(null);
const spikeLines: string[] = [];

if (typeof anySdk.useExtensions === 'function') {
  const registered = anySdk.useExtensions().layouts?.value ?? [];
  const tabular = registered.find((l: { id: string }) => l.id === 'tabular');
  spikeOptionsComp.value = tabular?.slots?.options ?? null;
  spikeLines.push(`slots.options do tabular: ${spikeOptionsComp.value ? 'achado' : 'ausente'}`);
}

if (typeof anySdk.useLayout === 'function') {
  spikeWrapper.value = anySdk.useLayout(ref('tabular')).layoutWrapper.value ?? null;
  spikeLines.push(`wrapper proprio do painel: ${spikeWrapper.value ? 'criado' : 'nulo'}`);
}

const spikeReport = spikeLines.join(' · ');

const spikeWrapperProps = computed(() => ({
  collection: props.collection,
  selection: [],
  layoutOptions: {},
  layoutQuery: { fields: ['name'], sort: ['name'], limit: 25, page: 1 },
  filter: null,
  search: null,
}));
/* ---- fim do SPIKE v6 ---- */

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
