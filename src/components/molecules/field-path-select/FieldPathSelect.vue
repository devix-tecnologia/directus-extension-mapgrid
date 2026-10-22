<template>
  <div class="field-path-select">
    <v-menu placement="bottom-start" show-arrow :close-on-content-click="false" v-model="menuOpen">
      <template #activator="{ toggle, active }">
        <button
          type="button"
          class="field-path-select__activator"
          :class="{ 'field-path-select__activator--active': active }"
          data-field-path-activator
          @click="toggle"
        >
          <span v-if="single" class="field-path-select__name">{{ nameOf(single) }}</span>
          <span v-else class="field-path-select__placeholder">{{ props.placeholder }}</span>
          <v-icon name="expand_more" small />
        </button>
      </template>
      <div class="field-path-select__tree" data-field-tree>
        <field-tree-level
          :collection="props.collection"
          :nodes-of="props.nodesOf"
          :chosen="single"
          @choose="pick"
        />
      </div>
    </v-menu>
    <button
      v-if="single && props.clearable"
      type="button"
      class="field-path-select__clear"
      data-field-path-clear
      :aria-label="t('fieldPathClear')"
      @click="emit('update:modelValue', null)"
    >
      <v-icon name="close" small />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { FieldPathSelectEmits, FieldPathSelectProps } from './FieldPathSelect.types';
import FieldTreeLevel from './FieldTreeLevel.vue';

const props = defineProps<FieldPathSelectProps>();
const emit = defineEmits<FieldPathSelectEmits>();
const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const single = computed(() => props.modelValue || null);

const nameOf = (path: string): string =>
  props.fields?.find((field) => field.field === path)?.name?.trim() || path;

const menuOpen = ref(false);

const pick = (path: string): void => {
  menuOpen.value = false;
  emit('update:modelValue', path);
};
</script>

<style scoped>
.field-path-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.field-path-select__activator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: var(--theme--form--field--input--height, 52px);
  padding: 0 12px 0 16px;
  border: var(--theme--border-width, 2px) solid var(--theme--form--field--input--border-color, #e4eaf1);
  border-radius: var(--theme--border-radius, 6px);
  background: var(--theme--form--field--input--background, #fff);
  color: var(--theme--form--field--input--foreground, #172940);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.field-path-select__activator:hover,
.field-path-select__activator--active {
  border-color: var(--theme--form--field--input--border-color-focus, #6644ff);
}

.field-path-select__tree {
  min-width: 260px;
  max-height: 360px;
  overflow-y: auto;
}

.field-path-select__placeholder {
  color: var(--theme--foreground-subdued, #a2b5cd);
}

.field-path-select__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-path-select__clear {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: none;
  color: var(--theme--foreground-subdued, #a2b5cd);
  cursor: pointer;
}

.field-path-select__clear {
  position: absolute;
  top: calc(var(--theme--form--field--input--height, 52px) / 2 - 10px);
  right: 40px;
}

.field-path-select__clear:hover {
  color: var(--theme--danger, #e35169);
}
</style>
