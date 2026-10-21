<template>
  <Teleport to="body">
    <div v-if="props.anchor" class="tour-spotlight" data-tour-spotlight :style="spotlightStyle" />
    <section
      v-if="props.anchor"
      ref="balloon"
      class="tour-balloon"
      :class="`tour-balloon--${place.side}`"
      role="dialog"
      aria-modal="false"
      :aria-label="props.title"
      data-tour-balloon
      :data-tour-step="props.stepId"
      :style="{ top: `${place.top}px`, left: `${place.left}px`, '--tour-arrow': `${place.arrow}px` }"
    >
      <span class="tour-balloon__arrow" aria-hidden="true" />
      <header class="tour-balloon__header">
        <span class="tour-balloon__count" data-tour-count>
          {{ t('tourCount', { number: props.number, total: props.total }) }}
        </span>
        <button
          type="button"
          class="tour-balloon__close"
          data-tour-close
          :aria-label="t('tourClose')"
          :title="t('tourClose')"
          @click="emit('close')"
        >
          <v-icon name="close" small />
        </button>
      </header>
      <h3 class="tour-balloon__title" data-tour-title>{{ props.title }}</h3>
      <p class="tour-balloon__body">{{ props.body }}</p>
      <footer class="tour-balloon__actions">
        <v-button
          v-if="props.number > 1"
          small
          secondary
          data-tour-previous
          @click="emit('previous')"
        >
          {{ t('tourPrevious') }}
        </v-button>
        <v-button small data-tour-next @click="emit('next')">
          {{ isLast ? t('tourDone') : t('tourNext') }}
        </v-button>
      </footer>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type BalloonPlace, BalloonPlacement } from '../../../services/balloon-placement/index';
import { MESSAGES } from '../../../shared/messages';
import type { TourBalloonEmits, TourBalloonProps } from './TourBalloon.types';

const props = defineProps<TourBalloonProps>();
const emit = defineEmits<TourBalloonEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const placement = new BalloonPlacement();
const balloon = ref<HTMLElement | null>(null);
/** The balloon's size is only known once drawn; until then a typical one is assumed. */
const size = ref({ width: 320, height: 180 });
const viewport = ref({ width: 1280, height: 800 });

const isLast = computed(() => props.number >= props.total);

const place = computed<BalloonPlace>(() =>
  props.anchor
    ? placement.place(props.anchor, size.value, viewport.value)
    : { side: 'bottom', top: 0, left: 0, arrow: 0 }
);

/** A little wider than the feature, so its border is not lost under the outline. */
const SPOTLIGHT_PADDING_PX = 6;

const spotlightStyle = computed(() => {
  const anchor = props.anchor;
  if (!anchor) return {};
  return {
    top: `${anchor.top - SPOTLIGHT_PADDING_PX}px`,
    left: `${anchor.left - SPOTLIGHT_PADDING_PX}px`,
    width: `${anchor.width + SPOTLIGHT_PADDING_PX * 2}px`,
    height: `${anchor.height + SPOTLIGHT_PADDING_PX * 2}px`,
  };
});

const measure = (): void => {
  if (typeof window !== 'undefined') {
    viewport.value = { width: window.innerWidth, height: window.innerHeight };
  }
  const box = balloon.value?.getBoundingClientRect();
  if (box && box.width > 0 && box.height > 0) {
    size.value = { width: box.width, height: box.height };
  }
};

watch(
  () => [props.stepId, props.anchor],
  () => {
    void nextTick(measure);
  },
  { immediate: true }
);

onMounted(() => window.addEventListener('resize', measure));
onBeforeUnmount(() => window.removeEventListener('resize', measure));
</script>

<script lang="ts">
export default {
  name: 'TourBalloon',
};
</script>

<style scoped>
/* the feature stays lit; the rest of the screen dims under the outline's shadow */
.tour-spotlight {
  position: fixed;
  z-index: 900;
  border: 2px solid var(--theme--primary);
  border-radius: var(--theme--border-radius);
  box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.45);
  pointer-events: none;
  transition: all 200ms ease;
}

.tour-balloon {
  position: fixed;
  z-index: 901;
  inline-size: 320px;
  max-inline-size: calc(100vw - 16px);
  padding: 12px 14px;
  border-radius: calc(var(--theme--border-radius) + 2px);
  background: var(--theme--background);
  color: var(--theme--foreground);
  box-shadow: var(--theme--elevation-2xl);
  font-size: 14px;
  line-height: 1.45;
  transition:
    top 200ms ease,
    left 200ms ease;
}

.tour-balloon__arrow {
  position: absolute;
  inline-size: 14px;
  block-size: 14px;
  background: var(--theme--background);
  transform: rotate(45deg);
}

.tour-balloon--bottom .tour-balloon__arrow {
  inset-block-start: -7px;
  inset-inline-start: calc(var(--tour-arrow) - 7px);
}

.tour-balloon--top .tour-balloon__arrow {
  inset-block-end: -7px;
  inset-inline-start: calc(var(--tour-arrow) - 7px);
}

.tour-balloon--right .tour-balloon__arrow {
  inset-inline-start: -7px;
  inset-block-start: calc(var(--tour-arrow) - 7px);
}

.tour-balloon--left .tour-balloon__arrow {
  inset-inline-end: -7px;
  inset-block-start: calc(var(--tour-arrow) - 7px);
}

.tour-balloon__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tour-balloon__count {
  color: var(--theme--primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tour-balloon__close {
  display: inline-flex;
  padding: 2px;
  border-radius: 50%;
  color: var(--theme--foreground-subdued);
}

.tour-balloon__close:hover {
  background: var(--theme--background-accent);
}

.tour-balloon__title {
  margin: 4px 0 6px;
  font-size: 16px;
  font-weight: 700;
}

.tour-balloon__body {
  margin: 0 0 12px;
  color: var(--theme--foreground-subdued);
}

.tour-balloon__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
