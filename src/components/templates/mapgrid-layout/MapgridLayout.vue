<template>
  <div ref="layoutRoot" class="mapgrid-layout" :style="layoutHeight">
    <v-info v-if="missingLayout" icon="warning" :title="t('missingLayout')" center>
      {{ t('missingLayoutHint') }}
    </v-info>

    <div v-else class="mapgrid-container">
      <div
        ref="mapPane"
        class="mapgrid-pane mapgrid-pane--map"
        :class="{ 'mapgrid-pane--measuring': measuring }"
        @pointerdown="onPanePointerDown"
        @pointermove="onPanePointerMove"
        @wheel.passive="onPaneWheel"
        @click.capture="onPaneClick"
      >
        <component :is="map?.component" v-if="map?.component" v-bind="mapProps" />
        <MapTrail v-if="trailSegments.length > 0" :segments="trailSegments" />
        <CurrentMark
          v-if="currentPoint"
          :x="currentPoint.x"
          :y="currentPoint.y"
          :screen-angle="currentHeading.screen"
          :heading="currentHeading.geographic"
        />
        <MeasureOverlay
          v-if="measuring"
          :points="measuredOnScreen"
          :last-leg="measuredLastLeg"
          :total="measuredTotal"
          @clear="measured = []"
          @close="toggleMeasure"
        />
        <CaptureCard
          v-if="card"
          class="mapgrid-card"
          :title="card.title"
          :rows="card.rows"
          :coordinates="card.coordinates"
          :image-url="card.imageUrl"
          :collection="props.collection"
          :item="cardItem"
          @close="cardCollapsed = true"
        />
        <button
          v-else-if="props.showCard === true && cardCollapsed && currentId !== null"
          type="button"
          class="mapgrid-card-reopen"
          data-capture-card-reopen
          :title="t('cardShow')"
          @click="cardCollapsed = false"
        >
          <v-icon name="badge" small />
          <span>{{ t('cardShow') }}</span>
        </button>
        <MapToolbar
          class="mapgrid-toolbar"
          :at-start="atStart"
          :at-end="atEnd"
          :loading="loading"
          :playing="playing"
          :tracking="tracking"
          :measuring="measuring"
          @reset="resetView"
          @first="manualStep((position) => sequence.first(position))"
          @previous="manualStep((position) => sequence.previous(position))"
          @next="manualStep((position) => sequence.next(position))"
          @last="manualStep((position) => sequence.last(position))"
          @play="startPlayback"
          @stop="stopPlayback"
          @measure="toggleMeasure"
          @tour="startTour"
          @update:tracking="props.setCameraTracking?.($event)"
        />
      </div>

      <TripTimelineBar
        v-if="timelineBar"
        class="mapgrid-timeline"
        :start-label="timelineBar.startLabel"
        :end-label="timelineBar.endLabel"
        :ticks="timelineBar.ticks"
        :marker="timelineBar.marker"
        :marker-label="timelineBar.markerLabel"
        :disabled="loading || !timelineBar.ready"
        @seek="seek"
      />

      <PaneSplitter
        :share="mapShare"
        @preview="shareDraft = $event"
        @commit="commitShare"
        @reset="commitShare(DEFAULT_MAP_SHARE)"
      />

      <div
        ref="gridPane"
        class="mapgrid-pane mapgrid-pane--grid"
        :style="{ flexBasis: `${Math.round((1 - mapShare) * 1000) / 10}%` }"
      >
        <component :is="grid?.component" v-if="grid?.component" v-bind="gridProps" />
      </div>
    </div>

    <TourBalloon
      v-if="tourPosition"
      :step-id="tourPosition.step.id"
      :title="t(TOUR_TEXT[tourPosition.step.id].title)"
      :body="t(TOUR_TEXT[tourPosition.step.id].body)"
      :number="tourPosition.number"
      :total="tourPosition.total"
      :anchor="tourAnchor"
      @next="moveTour('next')"
      @previous="moveTour('previous')"
      @close="finishTour"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GeoItem } from '../../../contract/index';
import type { Box } from '../../../services/balloon-placement/index';
import {
  BrowserMemory,
  SIDEBAR_COLLAPSED,
  TOUR_SEEN,
} from '../../../services/browser-memory/index';
import { CameraTrackingPolicy } from '../../../services/camera-tracking/index';
import { CardRows } from '../../../services/card-rows/index';
import {
  type Coordinate,
  DirectusCurrentPoint,
  type ScreenPoint,
} from '../../../services/current-point/index';
import { DistanceMeasure } from '../../../services/distance-measure/index';
import { EmbeddedStateReader } from '../../../services/embedded-state-reader/index';
import { FieldPath } from '../../../services/field-path/index';
import { FieldValues } from '../../../services/field-values/index';
import { InstantFormat } from '../../../services/instant-format/index';
import {
  KeyboardNavigation,
  type NavigationAction,
} from '../../../services/keyboard-navigation/index';
import { DirectusMapCenterer } from '../../../services/map-centerer/index';
import {
  OnboardingTour,
  type TourPosition,
  type TourStep,
  type TourStepId,
} from '../../../services/onboarding-tour/index';
import { PageTurnAnticipation } from '../../../services/page-turn-anticipation/index';
import { DEFAULT_MAP_SHARE, PaneSplit } from '../../../services/pane-split/index';
import { PlaybackClock } from '../../../services/playback-clock/index';
import { PlaybackTempo } from '../../../services/playback-tempo/index';
import { type CardRow, RecordCard } from '../../../services/record-card/index';
import { RecordHeading } from '../../../services/record-heading/index';
import { RecordInstants } from '../../../services/record-instants/index';
import {
  type PageEdge,
  type RecordId,
  RecordSequence,
  type SequencePosition,
  type SequenceStep,
} from '../../../services/record-sequence/index';
import { TableRowHighlighter } from '../../../services/row-highlighter/index';
import { TrailPath, type TrailSegment } from '../../../services/trail-path/index';
import { type TimelineRange, TripTimeline } from '../../../services/trip-timeline/index';
import { VisitedPath } from '../../../services/visited-path/index';
import { MESSAGES, type MessageKey } from '../../../shared/messages';
import CaptureCard from '../../molecules/capture-card/CaptureCard.vue';
import CurrentMark from '../../molecules/current-mark/CurrentMark.vue';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
import MapTrail from '../../molecules/map-trail/MapTrail.vue';
import MeasureOverlay from '../../molecules/measure-overlay/MeasureOverlay.vue';
import PaneSplitter from '../../molecules/pane-splitter/PaneSplitter.vue';
import TourBalloon from '../../molecules/tour-balloon/TourBalloon.vue';
import TripTimelineBar from '../../molecules/trip-timeline-bar/TripTimelineBar.vue';
import type { MapgridLayoutProps } from './MapgridLayout.types';

const props = defineProps<MapgridLayoutProps>();

/*
 * The warnings are off because the card resolves the collection's own `$t:`
 * labels here too: those live in the app's translations, not in ours, and the
 * lookup falling back to them is the point, not a slip.
 */
const { t, locale } = useI18n({
  useScope: 'local',
  messages: MESSAGES,
  missingWarn: false,
  fallbackWarn: false,
});

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

const primaryKey = (): string => props.primaryKeyField?.field ?? 'id';

/** A record by its key: the loaded one when it is on the page, a bare key otherwise. */
const itemFor = (id: RecordId): Record<string, unknown> => {
  const loaded = gridItems.value.find((item) => item.id === id);
  if (loaded) return loaded;
  const featureId = props.map?.state?.featureId;
  return typeof featureId === 'string' ? { id, [featureId]: id } : { id };
};

const currentId = ref<RecordId | null>(null);
/** The end of the page a `page` step is waiting for, `null` when none is pending. */
const pendingEdge = ref<PageEdge | null>(null);
/** A record the timeline asked for on another page; it wins over the edge when the page lands. */
let pendingId: RecordId | null = null;

const position = computed<SequencePosition>(() => ({
  currentId: currentId.value,
  ids: ids.value,
  page: props.page ?? 1,
  totalPages: Number(props.grid?.state.totalPages ?? 1),
}));

const atStart = computed(() => sequence.atStart(position.value));
const atEnd = computed(() => sequence.atEnd(position.value));

/** The current record's mark, drawn beside the map — see `DirectusCurrentPoint`. */
const currentPointer = computed<DirectusCurrentPoint | null>(() => {
  const state = props.map?.state;
  return state ? new DirectusCurrentPoint(state, paneSize) : null;
});

const visited = new VisitedPath();
/** The path is a plain object, so its changes are counted here for what draws it. */
const pathVersion = ref(0);

const fieldValues = new FieldValues({
  primaryKey,
  gridItems: () => gridItems.value,
  fetchItems: (keys, fields) => props.fetchItems?.(keys, fields) ?? Promise.resolve([]),
});
/** Bumped when values arrive from the server, which the cache does not announce. */
const valuesVersion = ref(0);

/** The only writer of the current record: marks the row and, if tracking asks, moves the camera. */
const focus = (id: RecordId | null, item?: GeoItem): void => {
  currentId.value = id;
  const index = id === null ? -1 : ids.value.indexOf(id);
  void nextTick(() => highlighter.highlight(index));

  if (id === null) return;
  const record = item ?? gridItems.value[index] ?? (itemFor(id) as GeoItem);
  visited.visit(id, currentPointer.value?.coordinateOf(record) ?? null);
  pathVersion.value += 1;
  loadHeadingOf(id);

  const framing = trackingPolicy.framing(tracking.value, { zoomIn: props.zoomOnClick === true });
  if (framing && centerer.value?.centerItem(record, framing) === true) awaitCamera();
};

/** A page that has just landed may reach the map after the grid: its visits get their place then. */
watch(
  () => props.map?.state?.geojson,
  () => {
    visited.resolve((id) => currentPointer.value?.coordinateOf(itemFor(id)) ?? null);
    pathVersion.value += 1;
  }
);

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

const project = (coordinate: Coordinate): ScreenPoint | null => {
  void paneResizes.value;
  return currentPointer.value?.screenPointOfCoordinate(coordinate) ?? null;
};

const currentPoint = computed<ScreenPoint | null>(() => {
  void paneResizes.value;
  const id = currentId.value;
  if (!cameraSettled.value || id === null) return null;

  const index = ids.value.indexOf(id);
  const item = (gridItems.value[index] ?? itemFor(id)) as Record<string, unknown>;
  return currentPointer.value?.screenPointOf(item) ?? null;
});

const heading = new RecordHeading();
const headingSource = computed(() => heading.sourceFrom(props.headingSource));

const loadHeadingOf = (id: RecordId): void => {
  const field = props.headingField;
  if (headingSource.value !== 'field' || !field) return;
  void fieldValues
    .load([id], field)
    .then(() => {
      valuesVersion.value += 1;
    })
    .catch(() => {});
};

const NO_HEADING = { screen: null, geographic: null } as const;

/** No direction is better than a wrong one: no repeating the last known, no guessing. */
const currentHeading = computed<{ screen: number | null; geographic: number | null }>(() => {
  void pathVersion.value;
  void valuesVersion.value;
  const id = currentId.value;
  if (id === null || !cameraSettled.value) return NO_HEADING;

  if (headingSource.value === 'computed') {
    const before = visited.previous();
    const now = visited.last();
    if (now?.id !== id || !before?.coordinate || !now.coordinate) return NO_HEADING;
    const from = project(before.coordinate);
    const to = project(now.coordinate);
    if (!from || !to) return NO_HEADING;
    return {
      screen: heading.screenAngle(from, to),
      geographic: heading.azimuth(before.coordinate, now.coordinate),
    };
  }

  if (headingSource.value === 'field' && props.headingField) {
    const geographic = heading.fromField(fieldValues.peek(id, props.headingField));
    const bearing = currentPointer.value?.bearing() ?? null;
    if (geographic === null || bearing === null) return NO_HEADING;
    return { screen: heading.onScreen(geographic, bearing), geographic };
  }

  return NO_HEADING;
});

const trailPath = new TrailPath();
const trailLength = computed(() => trailPath.lengthFrom(props.trailLength));

const trailSegments = computed<TrailSegment[]>(() => {
  void pathVersion.value;
  void paneResizes.value;
  const size = paneSize();
  if (trailLength.value === 0 || !cameraSettled.value || !size) return [];

  const points = visited
    .points(trailLength.value)
    .map((visit) => (visit.coordinate ? project(visit.coordinate) : null));
  return trailPath.segments(points, size);
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

  timeline.reset();
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

/** A step the person asked for: the timeline's marker may go back with it. */
const manualStep = (resolve: (position: SequencePosition) => SequenceStep | null): void => {
  timeline.reset();
  step(resolve);
};

/** The page changed under us — the mark is on a row that is now another record. */
watch(gridItems, () => {
  if (pendingEdge.value !== null) return;
  void nextTick(() =>
    highlighter.highlight(currentId.value === null ? -1 : ids.value.indexOf(currentId.value))
  );
});

const playing = ref(false);

const DEFAULT_PLAYBACK_SECONDS = 2;
/** One second at least: each step starts a camera animation. */
const MINIMUM_PLAYBACK_MS = 1_000;

const beatMs = (): number =>
  Math.max(MINIMUM_PLAYBACK_MS, (props.playbackInterval ?? DEFAULT_PLAYBACK_SECONDS) * 1_000);

const tempo = new PlaybackTempo();
const instants = new RecordInstants(fieldValues);
const playbackTiming = computed(() => tempo.timingFrom(props.playbackTiming));
const playbackSpeed = computed(() => tempo.speedFrom(props.playbackSpeed));

/** The chosen field, or the sort's date — offered, never written to the preset. */
const timeField = computed<string | null>(
  () =>
    props.playbackTimeField ||
    instants.suggestedField(props.sort, props.fieldsInCollection ?? []) ||
    null
);

watch(
  [ids, timeField],
  () => {
    const field = timeField.value;
    if (!field || ids.value.length === 0) return;
    void instants
      .load(ids.value, field)
      .then(() => {
        valuesVersion.value += 1;
      })
      .catch(() => {});
  },
  { immediate: true }
);

/**
 * The wait before the next record. With the data's clock it is the time
 * between the current record and the next; when the next is on a page not
 * loaded yet, the page's typical gap stands in for it.
 */
const nextWaitMs = (): number => {
  const field = timeField.value;
  if (playbackTiming.value !== 'realtime' || !field) return beatMs();

  const options = { speed: playbackSpeed.value, cameraMoves: tracking.value !== 'off' };
  const id = currentId.value;
  if (id === null) return tempo.waitMs(null, null, options);

  const next = ids.value[ids.value.indexOf(id) + 1];
  if (next !== undefined) {
    return tempo.waitMs(instants.instantOf(id, field), instants.instantOf(next, field), options);
  }
  const typical = tempo.medianDelta(ids.value.map((record) => instants.instantOf(record, field)));
  return tempo.waitMs(0, typical, options);
};

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

const clock = new PlaybackClock(nextWaitMs, onBeat);

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
  }, anticipation.delayMs(nextWaitMs()));
};

const stopPlayback = (): void => {
  stopAnticipating();
  clock.stop();
  playing.value = false;
};

const startPlayback = (): void => {
  if (playing.value) return;

  playing.value = true;
  clock.start();
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
  const wanted = pendingId;
  pendingId = null;
  focus(wanted !== null && ids.value.includes(wanted) ? wanted : sequence.atEdge(ids.value, edge));

  // the beat restarts where the page lands, or its record keeps only what is left of the step
  if (!turnAnticipated) return;
  turnAnticipated = false;
  if (playing.value) clock.restart();
});

onBeforeUnmount(stopPlayback);

const timeline = new TripTimeline();
const timelineRange = ref<TimelineRange | null>(null);
let rangeRequest = 0;

const instantFrom = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? instant : null;
};

watch(
  [timeField, () => props.queryKey],
  () => {
    const request = ++rangeRequest;
    timelineRange.value = null;
    const field = timeField.value;
    if (!field || !props.fetchTimeRange) return;

    props
      .fetchTimeRange(field)
      .then(({ first, last }) => {
        if (request === rangeRequest) {
          timelineRange.value = timeline.range(instantFrom(first), instantFrom(last));
        }
      })
      .catch(() => {});
  },
  { immediate: true }
);

const instantFormat = new InstantFormat();
const formatInstant = (instant: number): string => instantFormat.dateTime(instant, locale.value);

/** Where the marker is; during playback it only moves forward. */
const timelineMarker = ref<number | null>(null);

watch([currentId, valuesVersion, timelineRange], () => {
  const field = timeField.value;
  const id = currentId.value;
  if (id === null || !field) {
    timelineMarker.value = null;
    return;
  }
  const position = timeline.positionOf(instants.instantOf(id, field), timelineRange.value);
  if (position === null) return;
  timelineMarker.value = playing.value ? timeline.advance(position) : position;
});

const timelineBar = computed(() => {
  void valuesVersion.value;
  const field = timeField.value;
  const range = timelineRange.value;
  if (!field) return null;
  // the bar takes its room as soon as there is a time field, before the span arrives:
  // appearing later shrank the map under whatever was being pointed at
  if (!range) {
    return {
      startLabel: '',
      endLabel: '',
      ticks: [],
      marker: null,
      markerLabel: undefined,
      ready: false,
    };
  }

  const ticks = ids.value
    .map((id) => timeline.positionOf(instants.instantOf(id, field), range))
    .filter((tick): tick is number => tick !== null);
  const currentInstant =
    currentId.value === null ? null : instants.instantOf(currentId.value, field);
  return {
    startLabel: formatInstant(range.start),
    endLabel: formatInstant(range.end),
    ticks,
    marker: timelineMarker.value,
    markerLabel: currentInstant === null ? undefined : formatInstant(currentInstant),
    ready: true,
  };
});

/** The record at a moment of the trip: on any page when the query is sorted by time, on this one otherwise. */
const seek = async (position: number): Promise<void> => {
  const field = timeField.value;
  const range = timelineRange.value;
  if (!field || !range) return;

  stopPlayback();
  timeline.reset();
  const instant = timeline.instantAt(position, range);

  const located = (await props.locateInstant?.(field, instant).catch(() => null)) ?? null;
  if (located) {
    if (located.page === (props.page ?? 1) && ids.value.includes(located.id)) {
      focus(located.id);
      return;
    }
    pendingId = located.id;
    pendingEdge.value = 'first';
    turnAskedAt = null;
    props.goToPage?.(located.page);
    return;
  }

  let nearest: RecordId | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const id of ids.value) {
    const at = instants.instantOf(id, field);
    if (at !== null && Math.abs(at - instant) < distance) {
      distance = Math.abs(at - instant);
      nearest = id;
    }
  }
  if (nearest !== null) focus(nearest);
};

const recordCard = new RecordCard((key) => t(key));
const cardLines = new CardRows();

/** A composed line as plain text, for the card's title, which is a heading and not a display. */
const plainText = (template: string, item: Record<string, unknown>): string =>
  template
    .replace(/{{\s*([^{}\s]+?)\s*}}/g, (_, path: string) => {
      const value = fieldPath.valueAt(item, path);
      return value === null || value === undefined || typeof value === 'object'
        ? ''
        : String(value);
    })
    .trim();
const fieldPath = new FieldPath();
const cardItem = ref<Record<string, unknown> | null>(null);
/**
 * Closing the card collapses it into a button, and it stays collapsed for the
 * records that follow — playback included — until the button opens it again.
 * Hiding it for one record only made playback reopen it at every step.
 */
const cardCollapsed = ref(false);
let cardRequest = 0;

/** A line that is one field alone keeps the MapGrid's own formatting; a composed one goes to Directus. */
const SINGLE_FIELD = /^\s*{{\s*([^{}\s]+?)\s*}}\s*$/;

const cardLineOptions = computed(() => {
  const geometry = props.map?.state?.geometryField;
  return cardLines
    .optionsFrom({
      cardRows: props.cardRows,
      cardFields: props.cardFields,
      gridFields: props.gridFields,
    })
    .filter((option) => {
      const single = SINGLE_FIELD.exec(option.template)?.[1];
      return single !== props.cardImageField && single !== geometry;
    });
});

const cardFieldList = computed<string[]>(() =>
  cardLines.fieldsOf(cardLineOptions.value.map((option) => option.template))
);

watch(
  [currentId, () => props.showCard, cardFieldList, () => props.cardImageField, cardCollapsed],
  () => {
    const request = ++cardRequest;
    const id = currentId.value;
    // collapsed, the card is not drawn: fetching for it at every playback step would be waste
    if (props.showCard !== true || id === null || cardCollapsed.value) {
      cardItem.value = null;
      return;
    }
    const fields = [primaryKey(), ...cardFieldList.value];
    if (props.cardImageField) fields.push(props.cardImageField);

    void (props.fetchItems?.([id], fields) ?? Promise.resolve([]))
      .then(([item]) => {
        if (request === cardRequest) cardItem.value = item ?? null;
      })
      .catch(() => {});
  },
  { immediate: true }
);

const imageIdOf = (value: unknown): string | null => {
  if (typeof value === 'string' && value !== '') return value;
  const id = (value as { id?: unknown } | null | undefined)?.id;
  return typeof id === 'string' ? id : null;
};

const card = computed<{
  title: string;
  rows: CardRow[];
  coordinates: string | null;
  imageUrl: string | null;
} | null>(() => {
  const item = cardItem.value;
  const id = currentId.value;
  if (!item || id === null || cardCollapsed.value) return null;

  const schema = props.fieldsWithRelated ?? props.fieldsInCollection ?? [];
  const nameOf = (path: string) => schema.find((field) => field.field === path)?.name ?? null;
  const lines = cardLines.rows(cardLineOptions.value, nameOf).flatMap((line): CardRow[] => {
    const single = SINGLE_FIELD.exec(line.template)?.[1];
    if (!single)
      return [{ field: line.key, label: line.label, value: '', template: line.template }];
    const [row] = recordCard.rows(item, [single], schema, locale.value);
    return row ? [{ ...row, label: line.label || row.label }] : [];
  });
  const [first, ...rows] = lines;
  const coordinate = currentPointer.value?.coordinateOf(itemFor(id)) ?? null;
  const imageId = props.cardImageField
    ? imageIdOf(fieldPath.firstAt(item, props.cardImageField))
    : null;
  return {
    title: (first?.template ? plainText(first.template, item) : first?.value) || String(id),
    rows,
    coordinates: coordinate ? recordCard.coordinates(coordinate, locale.value) : null,
    imageUrl: imageId && props.assetUrl ? props.assetUrl(imageId) : null,
  };
});

const distances = new DistanceMeasure();
const measuring = ref(false);
const measured = ref<Coordinate[]>([]);

const toggleMeasure = (): void => {
  measuring.value = !measuring.value;
  measured.value = [];
};

const measuredOnScreen = computed<(ScreenPoint | null)[]>(() =>
  cameraSettled.value ? measured.value.map((coordinate) => project(coordinate)) : []
);

const measuredLastLeg = computed(() => {
  const legs = distances.legs(measured.value);
  const last = legs[legs.length - 1];
  return last === undefined ? null : distances.format(last, locale.value);
});

const measuredTotal = computed(() =>
  measured.value.length < 2 ? null : distances.format(distances.total(measured.value), locale.value)
);

/** Close enough to a record to mean it: the point goes to the reading, not beside it. */
const SNAP_RADIUS_PX = 14;
/** A press that moved further than this was a pan, and its click marks nothing. */
const CLICK_TOLERANCE_PX = 4;
let pressedAt: { x: number; y: number } | null = null;

const onTheMap = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('.maplibregl-canvas-container') !== null;

const onPanePointerDown = (event: PointerEvent): void => {
  pressedAt = onTheMap(event.target) ? { x: event.clientX, y: event.clientY } : null;
};

/** The person is moving the map: what is drawn over it waits for the camera to land. */
const onPanePointerMove = (event: PointerEvent): void => {
  if (!pressedAt || event.buttons === 0) return;
  if (Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) > CLICK_TOLERANCE_PX) {
    awaitCamera();
  }
};

const onPaneWheel = (event: WheelEvent): void => {
  if (onTheMap(event.target)) awaitCamera();
};

const snapped = (point: ScreenPoint): Coordinate | null => {
  let nearest: Coordinate | null = null;
  let distance = SNAP_RADIUS_PX;
  for (const item of gridItems.value) {
    const coordinate = currentPointer.value?.coordinateOf(item);
    const on = coordinate ? project(coordinate) : null;
    if (!coordinate || !on) continue;
    const away = Math.hypot(on.x - point.x, on.y - point.y);
    if (away <= distance) {
      distance = away;
      nearest = coordinate;
    }
  }
  return nearest;
};

/** In the capture phase, so while measuring the map never sees the click and picks nothing. */
const onPaneClick = (event: MouseEvent): void => {
  if (!measuring.value || !onTheMap(event.target)) return;
  const pressed = pressedAt;
  pressedAt = null;
  if (
    pressed &&
    Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > CLICK_TOLERANCE_PX
  ) {
    return;
  }

  event.stopPropagation();
  event.preventDefault();
  const box = mapPane.value?.getBoundingClientRect();
  if (!box) return;
  const point = { x: event.clientX - box.left, y: event.clientY - box.top };
  const coordinate = snapped(point) ?? currentPointer.value?.coordinateAt(point) ?? null;
  if (coordinate) measured.value = [...measured.value, coordinate];
};

const TOUR_TEXT: Record<TourStepId, { title: MessageKey; body: MessageKey }> = {
  map: { title: 'tourMapTitle', body: 'tourMapBody' },
  grid: { title: 'tourGridTitle', body: 'tourGridBody' },
  filters: { title: 'tourFiltersTitle', body: 'tourFiltersBody' },
  navigation: { title: 'tourNavigationTitle', body: 'tourNavigationBody' },
  playback: { title: 'tourPlaybackTitle', body: 'tourPlaybackBody' },
  tracking: { title: 'tourTrackingTitle', body: 'tourTrackingBody' },
  heading: { title: 'tourHeadingTitle', body: 'tourHeadingBody' },
  card: { title: 'tourCardTitle', body: 'tourCardBody' },
  timeline: { title: 'tourTimelineTitle', body: 'tourTimelineBody' },
  measure: { title: 'tourMeasureTitle', body: 'tourMeasureBody' },
  reset: { title: 'tourResetTitle', body: 'tourResetBody' },
};

const tour = new OnboardingTour();
const tourMemory = new BrowserMemory(TOUR_SEEN);
const tourPosition = ref<TourPosition | null>(null);
const tourAnchor = ref<Box | null>(null);

const anchorOf = (step: TourStep): Element | null =>
  step.scope === 'page'
    ? document.querySelector(step.anchor)
    : (layoutRoot.value?.querySelector(step.anchor) ?? null);

const canShow = (step: TourStep): boolean => anchorOf(step) !== null;

const locateTour = (): void => {
  const step = tourPosition.value?.step;
  const box = step ? anchorOf(step)?.getBoundingClientRect() : undefined;
  tourAnchor.value = box
    ? { top: box.top, left: box.left, width: box.width, height: box.height }
    : null;
};

const finishTour = (): void => {
  tour.stop();
  tourPosition.value = null;
  tourAnchor.value = null;
  if (props.collection) tourMemory.remember(props.collection);
};

const moveTour = (direction: 'next' | 'previous'): void => {
  tourPosition.value = direction === 'next' ? tour.next(canShow) : tour.previous(canShow);
  if (!tourPosition.value) {
    finishTour();
    return;
  }
  void nextTick(locateTour);
};

/** Polls until `ready`, or until the deadline; the tour then shows whatever is there. */
const waitUntil = async (ready: () => boolean, deadlineMs: number): Promise<void> => {
  const until = Date.now() + deadlineMs;
  while (!ready() && Date.now() < until) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

/** Long enough for the card's record to arrive; short enough not to keep the tour waiting. */
const TOUR_READY_DEADLINE_MS = 2_000;

/**
 * The tour presents the features with a record in focus — the second one, so
 * the arrow has a record before it and the trail a leg to draw — and waits for
 * the card, so the count it shows on the first balloon is the count to the end.
 */
const startTour = async (): Promise<void> => {
  stopPlayback();
  if (measuring.value) toggleMeasure();
  // the tour presents the card, so it has to be open
  cardCollapsed.value = false;
  if (currentId.value === null) {
    manualStep((position) => sequence.first(position));
    await nextTick();
    step((position) => sequence.next(position));
  }
  for (const _ of [1, 2, 3]) await nextTick();
  await waitUntil(() => props.showCard !== true || cardItem.value !== null, TOUR_READY_DEADLINE_MS);
  await nextTick();

  tourPosition.value = tour.start(canShow);
  if (tourPosition.value) locateTour();
};

const TOUR_KEYS: Record<string, () => void> = {
  Escape: finishTour,
  ArrowRight: () => moveTour('next'),
  ArrowLeft: () => moveTour('previous'),
};

/** Long enough for the map to draw its points, so the first balloon does not point at a blank pane. */
const TOUR_AUTOSTART_DELAY_MS = 1_500;
let tourAutostart: ReturnType<typeof setTimeout> | null = null;

let tourConsidered = false;

/** The first time the records arrive, a browser that never saw the tour gets it. */
watch(
  ids,
  (loaded) => {
    if (tourConsidered || loaded.length === 0) return;
    tourConsidered = true;
    if (props.tourOnFirstVisit !== true || !props.collection) return;
    if (tourMemory.seen(props.collection)) return;
    tourAutostart = setTimeout(() => {
      tourAutostart = null;
      void startTour();
    }, TOUR_AUTOSTART_DELAY_MS);
  },
  { immediate: true }
);

const sidebarMemory = new BrowserMemory(SIDEBAR_COLLAPSED);

/**
 * The Directus app opens its right sidebar on wide screens, and over a map and
 * a grid it is space taken from both. The MapGrid closes it the first time this
 * browser opens the collection; reopened after that, it stays as the person left it.
 */
onMounted(() => {
  const collection = props.collection;
  if (!collection || sidebarMemory.seen(collection)) return;
  props.collapseSidebar?.();
  sidebarMemory.remember(collection);
});

/**
 * As tall as what is left of the window below where the layout starts. A fixed
 * `100vh - 120px` was the Directus 10 header; the 11 one is shorter, and 88px
 * were left blank under the grid.
 */
const layoutHeight = ref<{ height?: string }>({});
const fitHeight = (): void => {
  const top = layoutRoot.value?.getBoundingClientRect().top;
  if (top === undefined || typeof window === 'undefined') return;
  layoutHeight.value = { height: `${Math.max(320, Math.round(window.innerHeight - top))}px` };
};
onMounted(() => void nextTick(fitHeight));

const onWindowResize = (): void => {
  fitHeight();
  if (tourPosition.value) locateTour();
};

onMounted(() => window.addEventListener('resize', onWindowResize));
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (tourAutostart !== null) clearTimeout(tourAutostart);
});

const paneSplit = new PaneSplit();
/** The share while the handle is dragged: drawn at once, stored only on release. */
const shareDraft = ref<number | null>(null);
const mapShare = computed(() => shareDraft.value ?? paneSplit.from(props.mapShare));

/** MapLibre sizes its canvas on window resizes; the pane changing alone it would not see. */
const commitShare = (share: number): void => {
  shareDraft.value = null;
  props.setMapShare?.(paneSplit.from(share));
  void nextTick(() => window.dispatchEvent(new Event('resize')));
};

const keyboard = new KeyboardNavigation();

const KEYBOARD_ACTIONS: Record<NavigationAction, () => void> = {
  first: () => manualStep((position) => sequence.first(position)),
  last: () => manualStep((position) => sequence.last(position)),
  next: () => manualStep((position) => sequence.next(position)),
  playback: () => {
    if (playing.value) stopPlayback();
    else if (!atEnd.value) startPlayback();
  },
  previous: () => manualStep((position) => sequence.previous(position)),
};

/** On the document, not on the pane: the page starts with the focus nowhere, and the keys still answer. */
const onKeyDown = (event: KeyboardEvent): void => {
  if (tourPosition.value && TOUR_KEYS[event.key]) {
    event.preventDefault();
    TOUR_KEYS[event.key]?.();
    return;
  }
  if (!keyboard.inScope(layoutRoot.value, document.activeElement)) return;

  if (event.key === 'Escape' && measuring.value) {
    event.preventDefault();
    toggleMeasure();
    return;
  }

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
    pendingId = null;
    turnAskedAt = null;
    turnAnticipated = false;
    anticipation.reset();
    visited.clear();
    pathVersion.value += 1;
    fieldValues.clear();
    timeline.reset();
    focus(null);
  }
);

/** Overridden, or the map layout's `handleClick` navigates to the item screen; sets the current record, never `selection`. */
const selectItem = (payload: unknown): void => {
  const id = (payload as { id?: string | number } | null | undefined)?.id;
  if (id === undefined || id === null) return;

  timeline.reset();
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

.mapgrid-timeline {
  flex: none;
  margin-block: calc(-1 * var(--content-padding) / 2);
}

.mapgrid-toolbar {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  z-index: 2;
}

.mapgrid-card,
.mapgrid-card-reopen {
  position: absolute;
  inset-block-end: 28px;
  inset-inline-start: 8px;
  z-index: 2;
}

.mapgrid-card-reopen {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: calc(var(--theme--border-radius) + 4px);
  background: var(--theme--background);
  color: var(--theme--foreground);
  font-size: 13px;
  box-shadow: var(--theme--elevation-2xl);
  --v-icon-color: var(--theme--primary);
}

.mapgrid-card-reopen:hover {
  background: var(--theme--background-accent);
}

/*
 * The Directus map's hover popup is `position: fixed` at `z-index: 1`, the same
 * as the trail and the mark drawn after it — so it came out under the trail.
 * Above the toolbar and the card too: it is what the pointer is asking for.
 */
.mapgrid-pane--map :deep(.layout-map > .popup) {
  z-index: 3;
}

/* MapLibre writes the cursor inline on the canvas, so only `!important` wins over it */
.mapgrid-pane--measuring :deep(.maplibregl-canvas) {
  cursor: crosshair !important;
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
