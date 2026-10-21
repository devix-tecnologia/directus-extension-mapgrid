<template>
  <!--
    The configuration is the Directus layouts' own. Their panel mounts here
    bound to the SAME state that draws the area, because both are born in the
    `setup()` of `src/index.ts` — which Directus hands to the component and to
    the panel. Creating our own wrapper here would give separate state and one
    extra fetch.
  -->
  <!--
    The classes exist so the e2e has somewhere to start. Inside each section
    what draws is the Directus panel, whose labels change with locale and
    version; searching for "Map" in the page text would match half the screen.
    Same choice as the area panes, `.mapgrid-pane--map` and `.mapgrid-pane--grid`.
  -->
  <v-detail class="mapgrid-option mapgrid-option--map full" icon="map" :label="t('optionMapSection')">
    <div class="mapgrid-option__fields">
      <component :is="map?.optionsComponent" v-if="map?.optionsComponent" v-bind="map.state" />
      <p v-else class="no-panel">{{ t('optionPanelMissing') }}</p>
    </div>
  </v-detail>

  <v-detail
    class="mapgrid-option mapgrid-option--grid full"
    icon="table_rows"
    :label="t('optionGridSection')"
  >
    <div class="mapgrid-option__fields">
      <component :is="grid?.optionsComponent" v-if="grid?.optionsComponent" v-bind="grid.state" />
      <p v-else class="no-panel">{{ t('optionPanelMissing') }}</p>
    </div>
  </v-detail>

  <v-detail
    class="mapgrid-option mapgrid-option--zoom full"
    icon="zoom_in"
    :label="t('optionZoomOnClick')"
  >
    <div class="field">
      <v-checkbox v-model="zoomOnClick" :label="t('optionZoomOnClickLabel')" />
    </div>
  </v-detail>

  <v-detail
    class="mapgrid-option mapgrid-option--playback full"
    icon="play_circle"
    :label="t('optionPlayback')"
  >
    <div class="field">
      <v-input
        v-model="playbackInterval"
        type="number"
        min="1"
        step="1"
        :label="t('optionPlaybackInterval')"
      />
    </div>
    <div class="field">
      <p class="field-label">{{ t('optionPlaybackTiming') }}</p>
      <v-select v-model="playbackTiming" class="mapgrid-option__timing" :items="timingItems" />
    </div>
    <template v-if="playbackTiming === 'realtime'">
      <div class="field">
        <p class="field-label">{{ t('optionPlaybackSpeed') }}</p>
        <v-select v-model="playbackSpeed" class="mapgrid-option__speed" :items="speedItems" />
      </div>
    </template>
    <div class="field">
      <p class="field-label">{{ t('optionPlaybackTimeField') }}</p>
      <v-select
        v-model="playbackTimeField"
        class="mapgrid-option__time-field"
        :items="temporalFields"
        :placeholder="t('optionNone')"
        show-deselect
      />
      <small v-if="!props.playbackTimeField" class="hint" data-time-field-hint>
        {{
          suggestedTimeField
            ? t('optionTimeFieldSuggested', { field: suggestedTimeField })
            : t('optionTimeFieldNone')
        }}
      </small>
    </div>
  </v-detail>

  <v-detail
    class="mapgrid-option mapgrid-option--heading full"
    icon="navigation"
    :label="t('optionHeading')"
  >
    <div class="field">
      <p class="field-label">{{ t('optionHeadingSource') }}</p>
      <v-select v-model="headingSource" class="mapgrid-option__heading-source" :items="headingItems" />
    </div>
    <div v-if="headingSource === 'field'" class="field">
      <p class="field-label">{{ t('optionHeadingField') }}</p>
      <v-select
        v-model="headingField"
        class="mapgrid-option__heading-field"
        :items="numericFields"
        :placeholder="t('optionNone')"
      />
    </div>
  </v-detail>

  <v-detail class="mapgrid-option mapgrid-option--trail full" icon="timeline" :label="t('optionTrail')">
    <div class="field">
      <v-input
        v-model="trailLength"
        type="number"
        min="0"
        :max="MAX_TRAIL_LENGTH"
        step="1"
        :label="t('optionTrailLength')"
      />
    </div>
  </v-detail>

  <v-detail class="mapgrid-option mapgrid-option--card full" icon="badge" :label="t('optionCard')">
    <div class="field">
      <v-checkbox v-model="showCard" :label="t('optionShowCard')" />
    </div>
    <template v-if="showCard">
      <div class="field">
        <p class="field-label">{{ t('optionCardImageField') }}</p>
        <v-select
          v-model="cardImageField"
          class="mapgrid-option__card-image"
          :items="fileFields"
          :placeholder="t('optionNone')"
          show-deselect
        />
      </div>
      <div class="field">
        <p class="field-label">{{ t('optionCardFields') }}</p>
        <v-select
          v-model="cardFields"
          class="mapgrid-option__card-fields"
          :items="textualFields"
          multiple
          show-deselect
        />
      </div>
    </template>
  </v-detail>

  <v-detail class="mapgrid-option mapgrid-option--tour full" icon="tour" :label="t('optionTour')">
    <div class="field">
      <v-checkbox v-model="tourOnFirstVisit" :label="t('optionTourOnFirstVisit')" />
    </div>
  </v-detail>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { HeadingSource, PlaybackTiming } from '../../../contract/index';
import {
  PLAYBACK_SPEEDS,
  PLAYBACK_TIMINGS,
  PlaybackTempo,
} from '../../../services/playback-tempo/index';
import { HEADING_SOURCES, RecordHeading } from '../../../services/record-heading/index';
import { RecordInstants, TEMPORAL_FIELD_TYPES } from '../../../services/record-instants/index';
import { MAX_TRAIL_LENGTH, TrailPath } from '../../../services/trail-path/index';
import { MESSAGES } from '../../../shared/messages';
import type { MapgridOptionsEmits, MapgridOptionsProps } from './MapgridOptions.types';

const props = defineProps<MapgridOptionsProps>();

const emit = defineEmits<MapgridOptionsEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const grid = computed(() => props.grid);
const map = computed(() => props.map);

const zoomOnClick = computed<boolean | undefined, unknown>({
  get: () => props.zoomOnClick,
  set: (value) => emit('update:zoomOnClick', Boolean(value)),
});

/** A second is the floor: below it a step outruns the map's camera animation. */
const DEFAULT_PLAYBACK_SECONDS = 2;

const playbackInterval = computed<number, unknown>({
  get: () => props.playbackInterval ?? DEFAULT_PLAYBACK_SECONDS,
  set: (value) => emit('update:playbackInterval', Math.max(1, Math.round(Number(value) || 0))),
});

const tempo = new PlaybackTempo();
const heading = new RecordHeading();
const trail = new TrailPath();

const TIMING_LABEL: Record<PlaybackTiming, 'timingFixed' | 'timingRealtime'> = {
  fixed: 'timingFixed',
  realtime: 'timingRealtime',
};
const timingItems = computed(() =>
  PLAYBACK_TIMINGS.map((value) => ({ text: t(TIMING_LABEL[value]), value }))
);
const playbackTiming = computed<PlaybackTiming, unknown>({
  get: () => tempo.timingFrom(props.playbackTiming),
  set: (value) => emit('update:playbackTiming', tempo.timingFrom(value)),
});

const speedItems = PLAYBACK_SPEEDS.map((value) => ({ text: `${value}×`, value }));
const playbackSpeed = computed<number, unknown>({
  get: () => tempo.speedFrom(props.playbackSpeed),
  set: (value) => emit('update:playbackSpeed', tempo.speedFrom(Number(value))),
});

const fields = computed(() => props.fieldsInCollection ?? []);
const itemsOf = (accept: (field: (typeof fields.value)[number]) => boolean) =>
  fields.value
    .filter(accept)
    .map((field) => ({ text: field.name?.trim() || field.field, value: field.field }));

const temporalFields = computed(() =>
  itemsOf((field) => TEMPORAL_FIELD_TYPES.includes(field.type))
);
const NUMERIC_TYPES = ['integer', 'bigInteger', 'float', 'decimal'];
const numericFields = computed(() => itemsOf((field) => NUMERIC_TYPES.includes(field.type)));
const fileFields = computed(() =>
  itemsOf(
    (field) =>
      field.type === 'uuid' &&
      (field.meta?.special?.includes('file') === true || field.meta?.interface === 'file-image')
  )
);
/** Fields with a value of their own: the card is text, so relations and groups stay out. */
const textualFields = computed(() =>
  itemsOf(
    (field) => field.type !== 'alias' && field.type !== 'json' && !field.type.startsWith('geometry')
  )
);

/** Shown, never written: the clock only reads the sort when nothing was chosen. */
const suggestedTimeField = computed(() =>
  new RecordInstants({
    peek: () => undefined,
    load: async () => new Map(),
    clear: () => {},
  }).suggestedField(props.sort, fields.value)
);

const playbackTimeField = computed<string | null, unknown>({
  get: () => props.playbackTimeField || null,
  set: (value) => emit('update:playbackTimeField', typeof value === 'string' ? value : ''),
});

const HEADING_LABEL: Record<HeadingSource, 'headingOff' | 'headingField' | 'headingComputed'> = {
  off: 'headingOff',
  field: 'headingField',
  computed: 'headingComputed',
};
const headingItems = computed(() =>
  HEADING_SOURCES.map((value) => ({ text: t(HEADING_LABEL[value]), value }))
);
const headingSource = computed<HeadingSource, unknown>({
  get: () => heading.sourceFrom(props.headingSource),
  set: (value) => emit('update:headingSource', heading.sourceFrom(value)),
});
const headingField = computed<string | null, unknown>({
  get: () => props.headingField || null,
  set: (value) => emit('update:headingField', typeof value === 'string' ? value : ''),
});

const trailLength = computed<number, unknown>({
  get: () => trail.lengthFrom(props.trailLength),
  set: (value) => emit('update:trailLength', trail.lengthFrom(Number(value))),
});

const showCard = computed<boolean, unknown>({
  get: () => props.showCard === true,
  set: (value) => emit('update:showCard', Boolean(value)),
});
const cardImageField = computed<string | null, unknown>({
  get: () => props.cardImageField || null,
  set: (value) => emit('update:cardImageField', typeof value === 'string' ? value : ''),
});
const tourOnFirstVisit = computed<boolean, unknown>({
  get: () => props.tourOnFirstVisit === true,
  set: (value) => emit('update:tourOnFirstVisit', Boolean(value)),
});

const cardFields = computed<string[], unknown>({
  get: () => props.cardFields ?? [],
  set: (value) =>
    emit(
      'update:cardFields',
      Array.isArray(value)
        ? value.filter((field): field is string => typeof field === 'string')
        : []
    ),
});
</script>

<style scoped>
.field {
  margin-top: var(--form-vertical-gap);
}

/* the same grid as the Directus panel, so their `.field`s fit in the section */
.mapgrid-option__fields {
  display: grid;
  grid-template-columns: [start] minmax(0, 1fr) [half] minmax(0, 1fr) [full];
  gap: var(--theme--form--row-gap) var(--theme--form--column-gap);
  margin-top: var(--theme--form--row-gap);
}

.field-label {
  margin-block-end: 4px;
  color: var(--theme--foreground-subdued);
}

.hint {
  display: block;
  margin-block-start: 4px;
  color: var(--theme--foreground-subdued);
}

.no-panel {
  color: var(--theme--foreground-subdued);
  font-style: italic;
}
</style>
