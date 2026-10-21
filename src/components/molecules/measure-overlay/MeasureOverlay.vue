<template>
  <svg class="measure-overlay" data-measure-lines aria-hidden="true">
    <line
      v-for="(leg, index) in legs"
      :key="`leg-${index}`"
      class="measure-overlay__leg"
      :x1="leg.from.x"
      :y1="leg.from.y"
      :x2="leg.to.x"
      :y2="leg.to.y"
    />
    <template v-for="(point, index) in props.points" :key="`point-${index}`">
      <circle v-if="point" class="measure-overlay__point" data-measure-point :cx="point.x" :cy="point.y" r="5" />
    </template>
  </svg>

  <aside class="measure-panel" data-measure-panel>
    <header class="measure-panel__header">
      <v-icon name="straighten" small />
      <span>{{ t('measureTitle') }}</span>
    </header>

    <p v-if="props.points.length < 2" class="measure-panel__hint">{{ t('measureHint') }}</p>

    <dl v-else class="measure-panel__figures">
      <dt>{{ t('measureLastLeg') }}</dt>
      <dd data-measure-last-leg>{{ props.lastLeg }}</dd>
      <dt>{{ t('measureTotal') }}</dt>
      <dd data-measure-total>{{ props.total }}</dd>
    </dl>

    <footer class="measure-panel__actions">
      <v-button
        small
        secondary
        data-measure-clear
        :disabled="props.points.length === 0"
        @click="emit('clear')"
      >
        {{ t('measureClear') }}
      </v-button>
      <v-button small data-measure-close @click="emit('close')">{{ t('close') }}</v-button>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ScreenPoint } from '../../../services/current-point/index';
import { MESSAGES } from '../../../shared/messages';
import type { MeasureOverlayEmits, MeasureOverlayProps } from './MeasureOverlay.types';

const props = defineProps<MeasureOverlayProps>();
const emit = defineEmits<MeasureOverlayEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const legs = computed(() => {
  const drawn: { from: ScreenPoint; to: ScreenPoint }[] = [];
  for (let index = 1; index < props.points.length; index += 1) {
    const from = props.points[index - 1];
    const to = props.points[index];
    if (from && to) drawn.push({ from, to });
  }
  return drawn;
});
</script>

<script lang="ts">
export default {
  name: 'MeasureOverlay',
};
</script>

<style scoped>
.measure-overlay {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
}

.measure-overlay__leg {
  stroke: var(--theme--primary);
  stroke-width: 3px;
  stroke-dasharray: 8 6;
  stroke-linecap: round;
  filter: drop-shadow(0 0 1px var(--white, #fff));
}

.measure-overlay__point {
  fill: var(--theme--background);
  stroke: var(--theme--primary);
  stroke-width: 3px;
}

.measure-panel {
  position: absolute;
  inset-block-start: 56px;
  inset-inline-end: 8px;
  z-index: 2;
  inline-size: 240px;
  padding: 10px 12px;
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
  box-shadow: var(--theme--elevation-2xl);
  font-size: 13px;
}

.measure-panel__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-block-end: 6px;
  font-weight: 600;
  --v-icon-color: var(--theme--primary);
}

.measure-panel__hint {
  margin: 0 0 8px;
  color: var(--theme--foreground-subdued);
}

.measure-panel__figures {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 8px;
  margin: 0 0 8px;
}

.measure-panel__figures dt {
  color: var(--theme--foreground-subdued);
}

.measure-panel__figures dd {
  margin: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: end;
}

.measure-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
