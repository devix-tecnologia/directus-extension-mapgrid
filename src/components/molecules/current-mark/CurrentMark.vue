<template>
  <div
    class="current-mark"
    data-current-point
    :data-heading-degrees="headingDegrees"
    :style="{ left: `${props.x}px`, top: `${props.y}px` }"
  >
    <svg
      v-if="hasDirection"
      class="current-mark__cone"
      data-heading-cone
      viewBox="-20 -20 40 40"
      :style="{ transform: `translate(-50%, -50%) rotate(${props.screenAngle}deg)` }"
      aria-hidden="true"
    >
      <path d="M0 -19 L8 -6 L0 -9 L-8 -6 Z" />
    </svg>
    <div class="current-mark__ring" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CurrentMarkProps } from './CurrentMark.types';

const props = defineProps<CurrentMarkProps>();

const hasDirection = computed(
  () => typeof props.screenAngle === 'number' && Number.isFinite(props.screenAngle)
);

const headingDegrees = computed(() =>
  typeof props.heading === 'number' && Number.isFinite(props.heading)
    ? String(Math.round(props.heading) % 360)
    : undefined
);
</script>

<script lang="ts">
export default {
  name: 'CurrentMark',
};
</script>

<style scoped>
/* drawn over the canvas, so not clickable */
.current-mark {
  position: absolute;
  z-index: 1;
  inline-size: 22px;
  block-size: 22px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.current-mark__ring {
  position: absolute;
  inset: 0;
  border: 3px solid var(--theme--primary);
  border-radius: 50%;
  background-color: var(--theme--primary-background);
  box-shadow: 0 0 0 2px var(--white, #fff), var(--theme--elevation-2xl);
}

/* the white outline under the fill is what keeps it legible on a light and a dark basemap */
.current-mark__cone {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 52px;
  block-size: 52px;
  overflow: visible;
}

.current-mark__cone path {
  fill: var(--theme--primary);
  stroke: var(--white, #fff);
  stroke-width: 2.5px;
  stroke-linejoin: round;
  paint-order: stroke fill;
}
</style>
