<template>
  <svg class="map-trail" data-trail :data-trail-segments="props.segments.length" aria-hidden="true">
    <defs>
      <marker
        :id="arrowId"
        class="map-trail__arrow"
        viewBox="-6 -6 12 12"
        markerWidth="12"
        markerHeight="12"
        markerUnits="userSpaceOnUse"
        orient="auto"
      >
        <path d="M-3 -4 L4 0 L-3 4 Z" />
      </marker>
    </defs>

    <g
      v-for="(segment, index) in props.segments"
      :key="index"
      class="map-trail__segment"
      :style="{ opacity: segment.opacity }"
    >
      <polyline class="map-trail__halo" :points="pointsOf(segment)" />
      <polyline class="map-trail__line" :points="pointsOf(segment)" />
      <polyline
        class="map-trail__arrows"
        :points="pointsOf(segment)"
        :marker-mid="`url(#${arrowId})`"
        :marker-end="`url(#${arrowId})`"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { TrailSegment } from '../../../services/trail-path/index';
import type { MapTrailProps } from './MapTrail.types';

const props = defineProps<MapTrailProps>();

/** One marker per instance: two MapGrids on a page must not share an id. */
const arrowId = `mapgrid-trail-arrow-${Math.random().toString(36).slice(2, 10)}`;

const pointsOf = (segment: TrailSegment): string =>
  segment.points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
</script>

<script lang="ts">
export default {
  name: 'MapTrail',
};
</script>

<style scoped>
.map-trail {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
}

.map-trail polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.map-trail__halo {
  stroke: var(--white, #fff);
  stroke-width: 9px;
  opacity: 0.6;
}

.map-trail__line {
  stroke: var(--theme--primary);
  stroke-width: 5px;
}

.map-trail__arrows {
  stroke: none;
}

.map-trail__arrow path {
  fill: var(--theme--primary);
  stroke: var(--white, #fff);
  stroke-width: 1.5px;
  paint-order: stroke fill;
}
</style>
