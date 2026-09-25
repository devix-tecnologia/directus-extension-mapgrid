<template>
  <div class="mapgrid-layout">
    <v-info v-if="missingLayout" icon="warning" :title="t('missingLayout')" center>
      {{ t('missingLayoutHint') }}
    </v-info>

    <div v-else class="mapgrid-container">
      <div ref="mapPane" class="mapgrid-pane mapgrid-pane--map">
        <component :is="map?.component" v-if="map?.component" v-bind="mapProps" />
        <MapToolbar
          class="mapgrid-toolbar"
          :at-start="atStart"
          :at-end="atEnd"
          :loading="loading"
          :playing="playing"
          :tracking="tracking"
          @reset="resetView"
          @first="step((position) => sequence.first(position))"
          @previous="step((position) => sequence.previous(position))"
          @next="step((position) => sequence.next(position))"
          @last="step((position) => sequence.last(position))"
          @play="startPlayback"
          @stop="stopPlayback"
          @update:tracking="props.setCameraTracking?.($event)"
        />
      </div>

      <div ref="gridPane" class="mapgrid-pane mapgrid-pane--grid">
        <component :is="grid?.component" v-if="grid?.component" v-bind="gridProps" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GeoItem } from '../../../contract/index';
import { CameraTrackingPolicy } from '../../../services/camera-tracking/index';
import { EmbeddedStateReader } from '../../../services/embedded-state-reader/index';
import { DirectusMapCenterer } from '../../../services/map-centerer/index';
import {
  type PageEdge,
  type RecordId,
  RecordSequence,
  type SequencePosition,
  type SequenceStep,
} from '../../../services/record-sequence/index';
import { TableRowHighlighter } from '../../../services/row-highlighter/index';
import { MESSAGES } from '../../../shared/messages';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
import type { MapgridLayoutProps } from './MapgridLayout.types';

const props = defineProps<MapgridLayoutProps>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const missingLayout = computed(() => !props.grid?.component || !props.map?.component);

const mapPane = ref<HTMLElement | null>(null);
const gridPane = ref<HTMLElement | null>(null);

const centerer = computed<DirectusMapCenterer | null>(() => {
  const state = props.map?.state;
  if (!state) return null;
  return new DirectusMapCenterer(
    state,
    () => {
      const pane = mapPane.value;
      return pane ? { height: pane.clientHeight, width: pane.clientWidth } : null;
    },
    {
      afterUpdate: (task) => {
        void nextTick(task);
      },
      repeat: (task, intervalMs) => {
        const id = setInterval(task, intervalMs);
        return () => clearInterval(id);
      },
    },
    {
      fetchItems: (keys, fields) => props.fetchItems?.(keys, fields) ?? Promise.resolve([]),
      gridItems: () => (props.grid?.state.items as Record<string, unknown>[] | undefined) ?? [],
    }
  );
});

watch(
  () => props.map?.state?.cameraOptions,
  () => centerer.value?.onCameraMove()
);

const resetView = (): void => {
  centerer.value?.fitAll();
};

const sequence = new RecordSequence();
const trackingPolicy = new CameraTrackingPolicy();
const highlighter = new TableRowHighlighter(() => gridPane.value);

const tracking = computed(() => trackingPolicy.from(props.cameraTracking));

const gridItems = computed<GeoItem[]>(
  () => (props.grid?.state.items as GeoItem[] | undefined) ?? []
);
const ids = computed<RecordId[]>(() => gridItems.value.map((item) => item.id));
const loading = computed(() => props.grid?.state.loading === true);

const currentId = ref<RecordId | null>(null);
/** The end of the page a `page` step is waiting for, `null` when none is pending. */
const pendingEdge = ref<PageEdge | null>(null);

const position = computed<SequencePosition>(() => ({
  currentId: currentId.value,
  ids: ids.value,
  page: props.page ?? 1,
  totalPages: Number(props.grid?.state.totalPages ?? 1),
}));

const atStart = computed(() => sequence.atStart(position.value));
const atEnd = computed(() => sequence.atEnd(position.value));

/**
 * The one place that says which record is current. The grid gets the mark, the
 * map gets the camera — and the camera only if the tracking state asks for it,
 * which is why `zoomOnClick` no longer decides movement, only zoom.
 *
 * `item` comes from the caller when it already has it (the row click hands the
 * whole record over); the marker click brings only the key, and there the map's
 * own feature is what the centerer reads.
 */
const focus = (id: RecordId | null, item?: GeoItem): void => {
  currentId.value = id;
  const index = id === null ? -1 : ids.value.indexOf(id);
  void nextTick(() => highlighter.highlight(index));

  if (id === null) return;
  const record = item ?? gridItems.value[index] ?? ({ id } as GeoItem);
  const framing = trackingPolicy.framing(tracking.value, { zoomIn: props.zoomOnClick === true });
  if (framing) centerer.value?.centerItem(record, framing);
};

/**
 * The row click is ours, and it has to be: without overriding `onRowClick`, the
 * Directus grid navigates to the item screen, which is the opposite of syncing
 * with the map — this extension's reason to exist.
 */
const frameItem = (payload: unknown): void => {
  const item = (payload as { item?: GeoItem } | null)?.item;
  if (!item) return;

  focus(item.id, item);
};

/**
 * A step never runs over a list that is still the old one: while the page is
 * being fetched the navigation waits, rather than skipping records.
 */
const step = (resolve: (position: SequencePosition) => SequenceStep | null): void => {
  if (loading.value) return;

  const target = resolve(position.value);
  if (!target) return;

  if (target.kind === 'item') {
    focus(target.id);
    return;
  }

  pendingEdge.value = target.edge;
  props.goToPage?.(target.page);
};

/** The page asked for has arrived: the record waiting at its edge becomes current. */
watch([ids, loading], () => {
  if (loading.value || pendingEdge.value === null) return;

  const edge = pendingEdge.value;
  pendingEdge.value = null;
  focus(sequence.atEdge(ids.value, edge));
});

/** The page changed under us — the mark is on a row that is now another record. */
watch(gridItems, () => {
  if (pendingEdge.value !== null) return;
  void nextTick(() =>
    highlighter.highlight(currentId.value === null ? -1 : ids.value.indexOf(currentId.value))
  );
});

const playing = ref(false);
let ticker: ReturnType<typeof setInterval> | null = null;

const DEFAULT_PLAYBACK_SECONDS = 2;
/**
 * Each step asks the map for a camera animation, so an interval shorter than
 * the animation would stack requests. A second is the floor.
 */
const MINIMUM_PLAYBACK_MS = 1_000;

const stopPlayback = (): void => {
  if (ticker !== null) clearInterval(ticker);
  ticker = null;
  playing.value = false;
};

const startPlayback = (): void => {
  if (playing.value) return;

  playing.value = true;
  const seconds = props.playbackInterval ?? DEFAULT_PLAYBACK_SECONDS;
  ticker = setInterval(
    () => {
      if (loading.value) return;
      if (atEnd.value) {
        stopPlayback();
        return;
      }
      step((position) => sequence.next(position));
    },
    Math.max(MINIMUM_PLAYBACK_MS, seconds * 1_000)
  );
};

onBeforeUnmount(stopPlayback);

/** Filter, search, sort or limit changed: the sequence is another one, so it restarts. */
watch(
  () => props.queryKey,
  () => {
    stopPlayback();
    pendingEdge.value = null;
    focus(null);
  }
);

/**
 * The marker click is the inverse path, and it also has to be ours: the map
 * layout's `handleClick` does a `router.push` to the item screen when it is not
 * in selection mode, so clicking a marker *left the MapGrid*.
 *
 * It used to mark the item in `selection`, which lit the row up for free — but
 * `selection` also arms the bulk actions, and "I am looking at this" read as "I
 * marked this to be deleted". Now it sets the current record, the same state
 * the row click sets: one state, two doors into it.
 */
const selectItem = (payload: unknown): void => {
  const id = (payload as { id?: string | number } | null | undefined)?.id;
  if (id === undefined || id === null) return;

  focus(id);
};

const readGridState = new EmbeddedStateReader();
const readMapState = new EmbeddedStateReader();

const gridProps = computed(() => ({
  ...readGridState.read(props.grid?.state),
  onRowClick: frameItem,
}));

const mapProps = computed(() => ({
  ...readMapState.read(props.map?.state),
  handleClick: selectItem,
}));
</script>

<style scoped>
.mapgrid-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  position: relative;
  padding: var(--content-padding);
  padding-top: 0;
  /* not --content-padding-bottom: that is the gap for full-page pagination */
  padding-bottom: var(--content-padding);
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

.mapgrid-pane {
  min-height: 0;
  position: relative;
}

.mapgrid-pane--map {
  flex: 1 1 auto;
  display: flex;
  overflow: hidden;
}

.mapgrid-pane--grid {
  flex: 0 0 40%;
  overflow: auto;
}

.mapgrid-toolbar {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  z-index: 2;
}

/*
 * The Directus layouts assume the whole page in details that are not in the
 * API, and composing means undoing each one. The three below were measured in
 * the DOM, not deduced:
 *
 * - `.layout-tabular` carries `margin: 32px 0 132px`, the gap for a full-page
 *   header and pagination — in half a screen it becomes a hole;
 * - the grid header is `sticky` offset by the app header's height: `tr.fixed`
 *   fell 60px below the top of the table, with the first rows running under it.
 *   Here what scrolls is the pane;
 * - `.layout-map` starts as `flex: 0 1 auto` and does not stretch, leaving a
 *   white band.
 */
.mapgrid-pane--grid :deep(.layout-tabular) {
  margin-block: 0;
}

.mapgrid-pane--grid :deep(thead.table-header tr.fixed) {
  top: 0;
}

/*
 * The current record, which the `v-table` has no notion of. It is not the
 * `selection`: that one paints the row too, and also arms the bulk actions.
 * The bar on the inline start is what tells the two apart at a glance.
 */
.mapgrid-pane--grid :deep(tbody tr.mapgrid-current-row) {
  background-color: var(--theme--primary-background);
  box-shadow: inset 4px 0 0 0 var(--theme--primary);
}

.mapgrid-pane--map :deep(.layout-map) {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}
</style>
