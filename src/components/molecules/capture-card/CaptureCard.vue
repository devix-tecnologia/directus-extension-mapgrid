<template>
  <section class="capture-card" data-capture-card :aria-busy="props.loading === true">
    <header class="capture-card__header">
      <span class="capture-card__title" data-capture-title>{{ props.title }}</span>
      <button
        type="button"
        class="capture-card__close"
        data-capture-close
        :aria-label="t('close')"
        :title="t('close')"
        @click="emit('close')"
      >
        <v-icon name="close" small />
      </button>
    </header>

    <div class="capture-card__body">
      <button
        v-if="props.imageUrl"
        type="button"
        class="capture-card__photo"
        data-capture-photo
        :title="t('cardEnlarge')"
        :aria-label="t('cardEnlarge')"
        @click="enlarged = true"
      >
        <img :src="props.imageUrl" :alt="props.title" />
        <v-icon class="capture-card__zoom" name="zoom_in" small />
      </button>

      <dl class="capture-card__fields">
        <template v-for="row in props.rows" :key="row.field">
          <dt>{{ row.label }}</dt>
          <dd :data-capture-field="row.field">{{ row.value }}</dd>
        </template>
        <template v-if="props.coordinates">
          <dt>{{ t('cardCoordinates') }}</dt>
          <dd data-capture-field="coordinates">{{ props.coordinates }}</dd>
        </template>
      </dl>
    </div>

    <Teleport to="body">
      <div
        v-if="enlarged && props.imageUrl"
        class="capture-card__enlarged"
        data-capture-photo-enlarged
        role="dialog"
        :aria-label="props.title"
        @click="enlarged = false"
      >
        <img :src="props.imageUrl" :alt="props.title" />
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { CaptureCardEmits, CaptureCardProps } from './CaptureCard.types';

const props = defineProps<CaptureCardProps>();
const emit = defineEmits<CaptureCardEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const enlarged = ref(false);

watch(
  () => props.imageUrl,
  () => {
    enlarged.value = false;
  }
);

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape' || !enlarged.value) return;
  event.stopPropagation();
  enlarged.value = false;
};

onMounted(() => document.addEventListener('keydown', onKeyDown, true));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown, true));
</script>

<script lang="ts">
export default {
  name: 'CaptureCard',
};
</script>

<style scoped>
.capture-card {
  display: flex;
  flex-direction: column;
  inline-size: 420px;
  max-inline-size: calc(100% - 16px);
  max-block-size: calc(100% - 72px);
  overflow: hidden;
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
  box-shadow: var(--theme--elevation-2xl);
  font-size: 13px;
}

.capture-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  border-block-end: 1px solid var(--theme--border-color-subdued);
}

.capture-card__title {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.04em;
  color: var(--theme--foreground);
}

.capture-card__close {
  display: inline-flex;
  padding: 4px;
  border-radius: 50%;
  color: var(--theme--foreground-subdued);
}

.capture-card__close:hover {
  background: var(--theme--background-accent);
}

.capture-card__body {
  display: flex;
  gap: 12px;
  min-block-size: 0;
  padding: 10px 12px 12px;
  overflow-y: auto;
}

.capture-card__photo {
  position: relative;
  flex: none;
  inline-size: 144px;
  block-size: 96px;
  overflow: hidden;
  border-radius: var(--theme--border-radius);
  cursor: zoom-in;
  background: var(--theme--background-subdued);
}

.capture-card__photo img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.capture-card__zoom {
  position: absolute;
  inset-block-end: 4px;
  inset-inline-end: 4px;
  padding: 2px;
  border-radius: 50%;
  background: var(--theme--background);
  --v-icon-color: var(--theme--primary);
}

.capture-card__fields {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 2px 8px;
  margin: 0;
  min-inline-size: 0;
}

.capture-card__fields dt {
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
}

/* the app styles `dd` to one ellipsised line; here the value is the point */
.capture-card__fields dd {
  margin: 0;
  overflow: visible;
  color: var(--theme--foreground);
  white-space: normal;
  text-overflow: clip;
  overflow-wrap: anywhere;
}

.capture-card__enlarged {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgb(0 0 0 / 0.75);
  cursor: zoom-out;
}

.capture-card__enlarged img {
  max-inline-size: 100%;
  max-block-size: 100%;
  border-radius: var(--theme--border-radius);
  box-shadow: var(--theme--elevation-2xl);
}
</style>
