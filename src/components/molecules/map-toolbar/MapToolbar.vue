<template>
  <div class="map-toolbar">
    <v-button
      v-tooltip="t('navFirst')"
      class="map-toolbar__button"
      data-control="first"
      icon
      rounded
      small
      secondary
      :disabled="cannotGoBack"
      @click="emit('first')"
    >
      <v-icon name="first_page" small />
    </v-button>

    <v-button
      v-tooltip="t('navPrevious')"
      class="map-toolbar__button"
      data-control="previous"
      icon
      rounded
      small
      secondary
      :disabled="cannotGoBack"
      @click="emit('previous')"
    >
      <v-icon name="chevron_left" small />
    </v-button>

    <v-button
      v-tooltip="t(props.playing === true ? 'playbackStop' : 'playbackPlay')"
      class="map-toolbar__button"
      data-control="playback"
      icon
      rounded
      small
      secondary
      :disabled="props.playing !== true && cannotGoForward"
      @click="togglePlayback"
    >
      <v-icon :name="props.playing === true ? 'stop' : 'play_arrow'" small />
    </v-button>

    <v-button
      v-tooltip="t('navNext')"
      class="map-toolbar__button"
      data-control="next"
      icon
      rounded
      small
      secondary
      :disabled="cannotGoForward"
      @click="emit('next')"
    >
      <v-icon name="chevron_right" small />
    </v-button>

    <v-button
      v-tooltip="t('navLast')"
      class="map-toolbar__button"
      data-control="last"
      icon
      rounded
      small
      secondary
      :disabled="cannotGoForward"
      @click="emit('last')"
    >
      <v-icon name="last_page" small />
    </v-button>

    <v-button
      v-tooltip="t(TRACKING_LABEL[tracking])"
      class="map-toolbar__button"
      data-control="tracking"
      icon
      rounded
      small
      secondary
      @click="emit('update:tracking', policy.cycle(tracking))"
    >
      <v-icon :name="TRACKING_ICON[tracking]" small />
    </v-button>

    <v-button
      v-tooltip="t('resetView')"
      class="map-toolbar__button"
      data-control="reset"
      icon
      rounded
      small
      secondary
      @click="emit('reset')"
    >
      <v-icon name="zoom_out_map" small />
    </v-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { type CameraTracking, CameraTrackingPolicy } from '../../../services/camera-tracking/index';
import { MESSAGES } from '../../../shared/messages';
import type { MapToolbarEmits, MapToolbarProps } from './MapToolbar.types';

const props = defineProps<MapToolbarProps>();
const emit = defineEmits<MapToolbarEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const policy = new CameraTrackingPolicy();

const TRACKING_ICON: Record<CameraTracking, string> = {
  off: 'gps_off',
  follow: 'gps_not_fixed',
  center: 'gps_fixed',
};

const TRACKING_LABEL: Record<CameraTracking, 'trackingOff' | 'trackingFollow' | 'trackingCenter'> =
  {
    off: 'trackingOff',
    follow: 'trackingFollow',
    center: 'trackingCenter',
  };

const tracking = computed<CameraTracking>(() => policy.from(props.tracking));

/** One button for the two controls: it shows, and asks for, whichever is possible now. */
const togglePlayback = (): void => {
  if (props.playing === true) emit('stop');
  else emit('play');
};

const cannotGoBack = computed(() => props.atStart === true || props.loading === true);
const cannotGoForward = computed(() => props.atEnd === true || props.loading === true);
</script>

<script lang="ts">
export default {
  name: 'MapToolbar',
};
</script>

<style scoped>
.map-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--theme--background);
  border-radius: calc(var(--theme--border-radius) + 4px);
  box-shadow: var(--theme--elevation-2xl);
}

.map-toolbar__button {
  --v-button-background-color: var(--theme--background);
  --v-button-background-color-hover: var(--theme--background-accent);
}

.map-toolbar__button :deep(.v-icon) {
  --v-icon-color: var(--theme--primary);
}

.map-toolbar__button :deep(button:disabled .v-icon) {
  --v-icon-color: var(--theme--foreground-subdued);
}
</style>
