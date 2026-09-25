<template>
  <div class="mapgrid-layout">
    <v-info v-if="missingLayout" icon="warning" :title="t('missingLayout')" center>
      {{ t('missingLayoutHint') }}
    </v-info>

    <div v-else class="mapgrid-container">
      <div ref="mapPane" class="mapgrid-pane mapgrid-pane--map">
        <component :is="map?.component" v-if="map?.component" v-bind="mapProps" />
        <MapToolbar class="mapgrid-toolbar" @reset="resetView" />
      </div>

      <div class="mapgrid-pane mapgrid-pane--grid">
        <component :is="grid?.component" v-if="grid?.component" v-bind="gridProps" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GeoItem } from '../../../contract/index';
import { EmbeddedStateReader } from '../../../services/embedded-state-reader/index';
import { DirectusMapCenterer } from '../../../services/map-centerer/index';
import { MESSAGES } from '../../../shared/messages';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
import type { MapgridLayoutProps } from './MapgridLayout.types';

const props = defineProps<MapgridLayoutProps>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const missingLayout = computed(() => !props.grid?.component || !props.map?.component);

const fromMap = <T>(key: string): T | undefined => props.map?.state[key] as T | undefined;

const mapPane = ref<HTMLElement | null>(null);

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

/**
 * The row click is ours, and it has to be: without overriding `onRowClick`, the
 * Directus grid navigates to the item screen, which is the opposite of syncing
 * with the map — this extension's reason to exist.
 */
const frameItem = (payload: unknown): void => {
  const item = (payload as { item?: GeoItem } | null)?.item;
  if (!item) return;

  centerer.value?.centerItem(item, {
    zoomIn: props.zoomOnClick === true,
    onlyIfOutside: false,
  });
};

/**
 * The marker click is the inverse path, and it also has to be ours: the map
 * layout's `handleClick` does a `router.push` to the item screen when it is not
 * in selection mode, so clicking a marker *left the MapGrid*.
 *
 * What takes its place is their other half: marking the item in `selection`,
 * which is state shared by both embedded layouts, and is how the matching row
 * lights up in the grid without the template touching its DOM. It adds and
 * removes like the grid checkbox, so marker and checkbox speak the same
 * language.
 *
 * It inherits a caveat: `selection` also arms the bulk actions, so marking from
 * the map enables deleting. Whether "current record" gets a highlight of its
 * own is task-006's call.
 */
const selectItem = (payload: unknown): void => {
  const id = (payload as { id?: string | number } | null | undefined)?.id;
  if (id === undefined || id === null) return;

  const selected = fromMap<(string | number)[]>('selection') ?? [];
  const next = selected.includes(id)
    ? selected.filter((candidate) => candidate !== id)
    : [...selected, id];

  fromMap<(value: unknown) => void>('onUpdate:selection')?.(next);
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

.mapgrid-pane--map :deep(.layout-map) {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}
</style>
