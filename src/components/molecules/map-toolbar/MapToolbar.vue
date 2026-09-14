<template>
  <v-button v-tooltip="t('resetView')" class="reset-map-btn" icon rounded @click="emit('reset')">
    <v-icon name="zoom_out_map" />
  </v-button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { MapToolbarEmits } from './MapToolbar.types';

const emit = defineEmits<MapToolbarEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });
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
