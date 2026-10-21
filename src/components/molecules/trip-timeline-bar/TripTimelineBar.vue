<template>
  <div class="trip-timeline" data-timeline :class="{ 'trip-timeline--disabled': props.disabled }">
    <span class="trip-timeline__edge" data-timeline-start>{{ props.startLabel }}</span>

    <div
      ref="track"
      class="trip-timeline__track"
      role="slider"
      tabindex="0"
      :aria-label="t('timelineLabel')"
      :aria-valuenow="shownPosition ?? undefined"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="props.markerLabel"
      :title="t('timelineSeek')"
      @pointerdown="startDrag"
      @pointermove="drag"
      @pointerup="endDrag"
      @pointercancel="cancelDrag"
      @keydown="nudge"
    >
      <div class="trip-timeline__rail" />
      <div
        v-if="shownPosition !== null"
        class="trip-timeline__progress"
        :style="{ inlineSize: `${shownPosition}%` }"
      />
      <span
        v-for="(tick, index) in props.ticks"
        :key="index"
        class="trip-timeline__tick"
        data-timeline-tick
        :style="{ left: `${tick}%` }"
      />
      <span
        v-if="shownPosition !== null"
        class="trip-timeline__marker"
        data-timeline-marker
        :data-position="shownPosition.toFixed(2)"
        :style="{ left: `${shownPosition}%` }"
      >
        <span v-if="props.markerLabel" class="trip-timeline__marker-label">
          {{ props.markerLabel }}
        </span>
      </span>
    </div>

    <span class="trip-timeline__edge" data-timeline-end>{{ props.endLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { TripTimelineBarEmits, TripTimelineBarProps } from './TripTimelineBar.types';

const props = defineProps<TripTimelineBarProps>();
const emit = defineEmits<TripTimelineBarEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const track = ref<HTMLElement | null>(null);
/** Where the marker is while being dragged; it only becomes a seek on release. */
const dragged = ref<number | null>(null);

const shownPosition = computed(() => dragged.value ?? props.marker);

const positionAt = (clientX: number): number => {
  const box = track.value?.getBoundingClientRect();
  if (!box || box.width <= 0) return 0;
  return Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100));
};

const startDrag = (event: PointerEvent): void => {
  if (props.disabled) return;
  track.value?.setPointerCapture?.(event.pointerId);
  dragged.value = positionAt(event.clientX);
};

const drag = (event: PointerEvent): void => {
  if (dragged.value === null) return;
  dragged.value = positionAt(event.clientX);
};

const endDrag = (event: PointerEvent): void => {
  if (dragged.value === null) return;
  const position = positionAt(event.clientX);
  dragged.value = null;
  emit('seek', position);
};

const cancelDrag = (): void => {
  dragged.value = null;
};

const KEY_STEP = 1;

const nudge = (event: KeyboardEvent): void => {
  if (props.disabled || props.marker === null) return;
  const step = event.key === 'ArrowRight' ? KEY_STEP : event.key === 'ArrowLeft' ? -KEY_STEP : 0;
  if (step === 0) return;
  // the arrows also walk the records; here they belong to the slider
  event.preventDefault();
  event.stopPropagation();
  emit('seek', Math.min(100, Math.max(0, props.marker + step)));
};
</script>

<script lang="ts">
export default {
  name: 'TripTimelineBar',
};
</script>

<style scoped>
.trip-timeline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  font-size: 12px;
  color: var(--theme--foreground-subdued);
}

.trip-timeline__edge {
  flex: none;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.trip-timeline__track {
  position: relative;
  flex: 1 1 auto;
  block-size: 28px;
  cursor: pointer;
  touch-action: none;
  outline: none;
}

.trip-timeline--disabled .trip-timeline__track {
  cursor: default;
  opacity: 0.5;
}

.trip-timeline__track:focus-visible .trip-timeline__rail {
  box-shadow: 0 0 0 2px var(--theme--primary-subdued, var(--theme--primary));
}

.trip-timeline__rail,
.trip-timeline__progress {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0;
  block-size: 4px;
  transform: translateY(-50%);
  border-radius: 2px;
}

.trip-timeline__rail {
  inline-size: 100%;
  background: var(--theme--border-color);
}

.trip-timeline__progress {
  background: var(--theme--primary);
}

.trip-timeline__tick {
  position: absolute;
  inset-block-start: 50%;
  inline-size: 6px;
  block-size: 6px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--theme--primary);
  opacity: 0.5;
}

.trip-timeline__marker {
  position: absolute;
  inset-block-start: 50%;
  inline-size: 16px;
  block-size: 16px;
  transform: translate(-50%, -50%);
  border: 3px solid var(--theme--primary);
  border-radius: 50%;
  background: var(--theme--background);
  box-shadow: var(--theme--elevation-2xl);
}

.trip-timeline__marker-label {
  position: absolute;
  inset-block-end: calc(100% + 4px);
  inset-inline-start: 50%;
  transform: translateX(-50%);
  padding: 1px 6px;
  border-radius: var(--theme--border-radius);
  background: var(--theme--primary);
  color: var(--theme--foreground-inverted, #fff);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
