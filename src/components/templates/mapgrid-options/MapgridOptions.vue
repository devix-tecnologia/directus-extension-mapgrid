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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

.no-panel {
  color: var(--theme--foreground-subdued);
  font-style: italic;
}
</style>
