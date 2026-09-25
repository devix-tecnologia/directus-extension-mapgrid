<template>
  <div ref="layoutRoot" class="mapgrid-layout">
    <v-info v-if="missingLayout" icon="warning" :title="t('missingLayout')" center>
      {{ t('missingLayoutHint') }}
    </v-info>

    <div v-else class="mapgrid-container">
      <div ref="mapPane" class="mapgrid-pane mapgrid-pane--map">
        <component :is="map?.component" v-if="map?.component" v-bind="mapProps" />
        <div
          v-if="currentPoint"
          class="mapgrid-current-point"
          data-current-point
          :style="{ left: `${currentPoint.x}px`, top: `${currentPoint.y}px` }"
        />
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GeoItem } from '../../../contract/index';
import { CameraTrackingPolicy } from '../../../services/camera-tracking/index';
import { DirectusCurrentPoint, type ScreenPoint } from '../../../services/current-point/index';
import { EmbeddedStateReader } from '../../../services/embedded-state-reader/index';
import {
  KeyboardNavigation,
  type NavigationAction,
} from '../../../services/keyboard-navigation/index';
import { DirectusMapCenterer } from '../../../services/map-centerer/index';
import { PageTurnAnticipation } from '../../../services/page-turn-anticipation/index';
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

const layoutRoot = ref<HTMLElement | null>(null);
const mapPane = ref<HTMLElement | null>(null);
const gridPane = ref<HTMLElement | null>(null);

const paneSize = (): { height: number; width: number } | null => {
  const pane = mapPane.value;
  return pane ? { height: pane.clientHeight, width: pane.clientWidth } : null;
};

const centerer = computed<DirectusMapCenterer | null>(() => {
  const state = props.map?.state;
  if (!state) return null;
  return new DirectusMapCenterer(
    state,
    paneSize,
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
  () => {
    centerer.value?.onCameraMove();
    cameraLanded();
  }
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

/** The only writer of the current record: marks the row and, if tracking asks, moves the camera. */
const focus = (id: RecordId | null, item?: GeoItem): void => {
  currentId.value = id;
  const index = id === null ? -1 : ids.value.indexOf(id);
  void nextTick(() => highlighter.highlight(index));

  if (id === null) return;
  const record = item ?? gridItems.value[index] ?? ({ id } as GeoItem);
  const framing = trackingPolicy.framing(tracking.value, { zoomIn: props.zoomOnClick === true });
  if (framing && centerer.value?.centerItem(record, framing) === true) awaitCamera();
};

/** The current record's mark, drawn beside the map — see `DirectusCurrentPoint`. */
const currentPointer = computed<DirectusCurrentPoint | null>(() => {
  const state = props.map?.state;
  return state ? new DirectusCurrentPoint(state, paneSize) : null;
});

/** The pane's size is not reactive: a resize is what makes the projection read it again. */
const paneResizes = ref(0);
/** The Directus map only publishes its camera on `moveend`; until then the projection is the old one. */
const cameraSettled = ref(true);
/** Long enough for a camera flight, short enough not to lose the mark if `moveend` never comes. */
const CAMERA_LANDING_DEADLINE_MS = 2_000;
let landing: ReturnType<typeof setTimeout> | null = null;

const cameraLanded = (): void => {
  if (landing !== null) clearTimeout(landing);
  landing = null;
  cameraSettled.value = true;
};

const awaitCamera = (): void => {
  cameraSettled.value = false;
  if (landing !== null) clearTimeout(landing);
  landing = setTimeout(cameraLanded, CAMERA_LANDING_DEADLINE_MS);
};

const currentPoint = computed<ScreenPoint | null>(() => {
  void paneResizes.value;
  const id = currentId.value;
  if (!cameraSettled.value || id === null) return null;

  const index = ids.value.indexOf(id);
  const item = (gridItems.value[index] ?? { id }) as Record<string, unknown>;
  return currentPointer.value?.screenPointOf(item) ?? null;
});

let paneObserver: ResizeObserver | null = null;

onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !mapPane.value) return;
  paneObserver = new ResizeObserver(() => {
    paneResizes.value += 1;
  });
  paneObserver.observe(mapPane.value);
});

onBeforeUnmount(() => {
  paneObserver?.disconnect();
  if (landing !== null) clearTimeout(landing);
});

/** Overridden, or the Directus grid navigates to the item screen. */
const frameItem = (payload: unknown): void => {
  const item = (payload as { item?: GeoItem } | null)?.item;
  if (!item) return;

  focus(item.id, item);
};

const anticipation = new PageTurnAnticipation();
/** When the page in flight was asked for, to measure what the fetch cost. */
let turnAskedAt: number | null = null;
/** The turn in flight was fired ahead of the beat, so the beat restarts where the page lands. */
let turnAnticipated = false;
let anticipating: ReturnType<typeof setTimeout> | null = null;

const stopAnticipating = (): void => {
  if (anticipating !== null) clearTimeout(anticipating);
  anticipating = null;
};

const turnTo = (target: Extract<SequenceStep, { kind: 'page' }>): void => {
  pendingEdge.value = target.edge;
  turnAskedAt = Date.now();
  props.goToPage?.(target.page);
};

/** Waits while a page is being fetched, instead of stepping over the old list. */
const step = (resolve: (position: SequencePosition) => SequenceStep | null): void => {
  stopAnticipating();
  if (loading.value) return;

  const target = resolve(position.value);
  if (!target) return;

  if (target.kind === 'item') {
    focus(target.id);
    return;
  }

  turnTo(target);
};

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
/** One second at least: each step starts a camera animation. */
const MINIMUM_PLAYBACK_MS = 1_000;

const beatMs = (): number =>
  Math.max(MINIMUM_PLAYBACK_MS, (props.playbackInterval ?? DEFAULT_PLAYBACK_SECONDS) * 1_000);

const onBeat = (): void => {
  // `pendingEdge` too: an anticipated turn is asked for before the layout reports loading
  if (loading.value || pendingEdge.value !== null) return;
  if (atEnd.value) {
    stopPlayback();
    return;
  }
  step((position) => sequence.next(position));
  anticipatePageTurn();
};

const restartBeat = (): void => {
  if (ticker !== null) clearInterval(ticker);
  ticker = setInterval(onBeat, beatMs());
};

/** Asks for the next page inside the step that precedes it. */
const anticipatePageTurn = (): void => {
  stopAnticipating();
  if (!playing.value) return;

  const target = sequence.next(position.value);
  if (target?.kind !== 'page') return;

  anticipating = setTimeout(() => {
    anticipating = null;
    turnAnticipated = true;
    turnTo(target);
  }, anticipation.delayMs(beatMs()));
};

const stopPlayback = (): void => {
  stopAnticipating();
  if (ticker !== null) clearInterval(ticker);
  ticker = null;
  playing.value = false;
};

const startPlayback = (): void => {
  if (playing.value) return;

  playing.value = true;
  restartBeat();
  anticipatePageTurn();
};

/** The page asked for has arrived: the record waiting at its edge becomes current. */
watch([ids, loading], () => {
  if (loading.value || pendingEdge.value === null) return;

  const edge = pendingEdge.value;
  pendingEdge.value = null;
  if (turnAskedAt !== null) {
    anticipation.measure(Date.now() - turnAskedAt);
    turnAskedAt = null;
  }
  focus(sequence.atEdge(ids.value, edge));

  // the beat restarts where the page lands, or its record keeps only what is left of the step
  if (!turnAnticipated) return;
  turnAnticipated = false;
  if (playing.value) restartBeat();
});

onBeforeUnmount(stopPlayback);

const keyboard = new KeyboardNavigation();

const KEYBOARD_ACTIONS: Record<NavigationAction, () => void> = {
  first: () => step((position) => sequence.first(position)),
  last: () => step((position) => sequence.last(position)),
  next: () => step((position) => sequence.next(position)),
  playback: () => {
    if (playing.value) stopPlayback();
    else if (!atEnd.value) startPlayback();
  },
  previous: () => step((position) => sequence.previous(position)),
};

/** On the document, not on the pane: the page starts with the focus nowhere, and the keys still answer. */
const onKeyDown = (event: KeyboardEvent): void => {
  if (!keyboard.inScope(layoutRoot.value, document.activeElement)) return;

  const action = keyboard.actionFor(event);
  if (!action) return;

  event.preventDefault();
  KEYBOARD_ACTIONS[action]();
};

onMounted(() => document.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown));

/** Filter, search, sort or limit changed: the sequence is another one, so it restarts. */
watch(
  () => props.queryKey,
  () => {
    stopPlayback();
    pendingEdge.value = null;
    turnAskedAt = null;
    turnAnticipated = false;
    anticipation.reset();
    focus(null);
  }
);

/** Overridden, or the map layout's `handleClick` navigates to the item screen; sets the current record, never `selection`. */
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

/* the current record over the map; drawn on the canvas, so not clickable */
.mapgrid-current-point {
  position: absolute;
  z-index: 1;
  inline-size: 22px;
  block-size: 22px;
  transform: translate(-50%, -50%);
  border: 3px solid var(--theme--primary);
  border-radius: 50%;
  background-color: var(--theme--primary-background);
  box-shadow: 0 0 0 2px var(--white), var(--theme--elevation-2xl);
  pointer-events: none;
}

/* the current record; the inline-start bar tells it apart from `selection` */
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
