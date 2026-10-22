<template>
  <section class="capture-card" data-capture-card :aria-busy="props.loading === true">
    <header class="capture-card__header">
      <span class="capture-card__title" data-capture-title>{{ props.title }}</span>
      <button
        type="button"
        class="capture-card__close"
        data-capture-close
        :aria-label="t('cardHide')"
        :title="t('cardHide')"
        @click="emit('close')"
      >
        <v-icon name="close_fullscreen" small />
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
          <dt :title="row.label">{{ row.label }}</dt>
          <dd v-if="row.template" :data-capture-field="row.field">
            <render-template
              :collection="props.collection"
              :item="props.item ?? {}"
              :template="row.template"
            />
          </dd>
          <dd v-else :data-capture-field="row.field" :title="row.value">{{ row.value }}</dd>
        </template>
        <template v-if="props.coordinates">
          <dt>{{ t('cardCoordinates') }}</dt>
          <dd data-capture-field="coordinates" :title="props.coordinates">
            {{ props.coordinates }}
          </dd>
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
  inline-size: 372px;
  max-inline-size: calc(100% - 16px);
  max-block-size: calc(100% - 64px);
  overflow: hidden;
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
  box-shadow: var(--theme--elevation-2xl);
  font-size: 12px;
  line-height: 1.35;
}

.capture-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 4px 4px 10px;
  border-block-end: 1px solid var(--theme--border-color-subdued);
}

.capture-card__title {
  font-weight: 700;
  font-size: 13px;
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
  align-items: flex-start;
  gap: 8px;
  min-block-size: 0;
  padding: 8px 10px;
  overflow-y: auto;
}

.capture-card__photo {
  position: relative;
  flex: none;
  inline-size: 96px;
  block-size: 64px;
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
  inset-block-end: 2px;
  inset-inline-end: 2px;
  padding: 1px;
  border-radius: 50%;
  background: var(--theme--background);
  --v-icon-color: var(--theme--primary);
}

.capture-card__fields {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1px 6px;
  margin: 0;
  min-inline-size: 0;
}

.capture-card__fields dt {
  max-inline-size: 84px;
  overflow: hidden;
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* one line per field, so the card stays short over the map; the full value is in the title */
.capture-card__fields dd {
  margin: 0;
  overflow: hidden;
  color: var(--theme--foreground);
  white-space: nowrap;
  text-overflow: ellipsis;
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
