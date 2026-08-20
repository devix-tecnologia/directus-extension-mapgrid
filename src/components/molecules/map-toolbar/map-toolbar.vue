<template>
  <v-button v-tooltip="'Reset view'" class="reset-map-btn" icon rounded @click="emit('reset')">
    <v-icon name="zoom_out_map" />
  </v-button>
</template>

<script setup lang="ts">
import type { MapToolbarEmits } from './map-toolbar.types';

const emit = defineEmits<MapToolbarEmits>();
</script>

<script lang="ts">
export default {
  name: 'MapToolbar',
};
</script>

<style scoped>
.reset-map-btn {
  position: absolute;
  top: var(--content-padding);
  right: var(--content-padding);
  z-index: 29;
  --v-button-background-color: var(--theme--background);
  --v-button-background-color-hover: var(--theme--background-accent);
  box-shadow: var(--theme--elevation-2xl);
}

.reset-map-btn :deep(.v-icon) {
  --v-icon-color: var(--theme--primary);
}
</style>
