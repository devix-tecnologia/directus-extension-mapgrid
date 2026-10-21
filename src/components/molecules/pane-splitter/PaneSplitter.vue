<template>
  <div
    ref="handle"
    class="pane-splitter"
    :class="{ 'pane-splitter--dragging': dragging }"
    role="separator"
    aria-orientation="horizontal"
    tabindex="0"
    :aria-label="t('splitResize')"
    :title="t('splitResize')"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(props.share * 100)"
    data-pane-splitter
    @pointerdown="startDrag"
    @pointermove="drag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @dblclick="emit('reset')"
    @keydown="nudge"
  >
    <span class="pane-splitter__grip" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { PaneSplit } from '../../../services/pane-split/index';
import { MESSAGES } from '../../../shared/messages';
import type { PaneSplitterEmits, PaneSplitterProps } from './PaneSplitter.types';

const props = defineProps<PaneSplitterProps>();
const emit = defineEmits<PaneSplitterEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const split = new PaneSplit();
const handle = ref<HTMLElement | null>(null);
const dragging = ref(false);
let last = props.share;
/** Where the press started; a press that did not travel is a click, and a click moves nothing. */
let pressedAt = 0;
let moved = false;
const DRAG_THRESHOLD_PX = 3;

const shareAt = (clientY: number): number => {
  const box = handle.value?.parentElement?.getBoundingClientRect();
  return box ? split.atPointer(clientY, box.top, box.height) : props.share;
};

const startDrag = (event: PointerEvent): void => {
  handle.value?.setPointerCapture?.(event.pointerId);
  dragging.value = true;
  last = props.share;
  pressedAt = event.clientY;
  moved = false;
};

const drag = (event: PointerEvent): void => {
  if (!dragging.value) return;
  if (!moved && Math.abs(event.clientY - pressedAt) < DRAG_THRESHOLD_PX) return;
  moved = true;
  last = shareAt(event.clientY);
  emit('preview', last);
};

const endDrag = (event: PointerEvent): void => {
  if (!dragging.value) return;
  dragging.value = false;
  // the clicks of a double click land here too, and must not store where the pointer sat
  if (!moved) return;
  if (event.type === 'pointerup') last = shareAt(event.clientY);
  emit('commit', last);
};

const nudge = (event: KeyboardEvent): void => {
  const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
  if (direction === 0) return;
  // the arrows also walk the records; on the handle they move it
  event.preventDefault();
  event.stopPropagation();
  emit('commit', split.step(props.share, direction));
};
</script>

<script lang="ts">
export default {
  name: 'PaneSplitter',
};
</script>

<style scoped>
.pane-splitter {
  position: relative;
  flex: none;
  block-size: 10px;
  margin-block: calc(-1 * var(--content-padding) / 2);
  cursor: row-resize;
  touch-action: none;
  outline: none;
}

.pane-splitter__grip {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 48px;
  block-size: 4px;
  transform: translate(-50%, -50%);
  border-radius: 2px;
  background: var(--theme--border-color);
  transition: background-color 120ms ease;
}

.pane-splitter:hover .pane-splitter__grip,
.pane-splitter:focus-visible .pane-splitter__grip,
.pane-splitter--dragging .pane-splitter__grip {
  inline-size: 72px;
  background: var(--theme--primary);
}
</style>
