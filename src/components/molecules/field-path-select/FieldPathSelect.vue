<template>
  <div class="field-path-select" :class="{ 'field-path-select--multiple': props.multiple }">
    <ul v-if="props.multiple && chosen.length" class="field-path-select__chosen">
      <li v-for="path in chosen" :key="path" class="field-path-select__item" :data-field-path="path">
        <span class="field-path-select__name">{{ nameOf(path) }}</span>
        <button
          type="button"
          class="field-path-select__remove"
          data-field-path-remove
          :aria-label="t('fieldPathRemove', { field: nameOf(path) })"
          @click="remove(path)"
        >
          <v-icon name="close" small />
        </button>
      </li>
    </ul>
    <v-menu placement="bottom-start" show-arrow>
      <template #activator="{ toggle, active }">
        <button
          type="button"
          class="field-path-select__activator"
          :class="{ 'field-path-select__activator--active': active }"
          data-field-path-activator
          @click="toggle"
        >
          <span v-if="single" class="field-path-select__name">{{ nameOf(single) }}</span>
          <span v-else class="field-path-select__placeholder">
            {{ props.multiple ? t('fieldPathAdd') : props.placeholder }}
          </span>
          <v-icon :name="props.multiple ? 'add' : 'expand_more'" small />
        </button>
      </template>
      <v-field-list
        :collection="props.collection"
        :field-filter="offered"
        :relational-field-selectable="props.relationalSelectable === true"
        :disabled-fields="chosen"
        @add="pick"
      />
    </v-menu>
    <button
      v-if="!props.multiple && single && props.clearable"
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type {
  FieldPathOption,
  FieldPathSelectEmits,
  FieldPathSelectProps,
} from './FieldPathSelect.types';

const props = defineProps<FieldPathSelectProps>();
const emit = defineEmits<FieldPathSelectEmits>();
const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const chosen = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue;
  return props.modelValue ? [props.modelValue] : [];
});
const single = computed(() => (props.multiple ? null : (chosen.value[0] ?? null)));

const nameOf = (path: string): string =>
  props.fields?.find((field) => field.field === path)?.name?.trim() || path;

const isRelation = (field: FieldPathOption): boolean =>
  Boolean(field.schema?.foreign_key_table) ||
  (field.meta?.special ?? []).some((special) => special === 'm2o' || special === 'file');

/** Relations stay, so they can be opened; of the rest, only what the picker accepts. */
const offered = (field: FieldPathOption): boolean =>
  isRelation(field) || (props.accept ? props.accept(field) : true);

const pick = (paths: string[]): void => {
  const [path] = paths;
  if (!path) return;
  if (!props.multiple) {
    emit('update:modelValue', path);
    return;
  }
  if (!chosen.value.includes(path)) emit('update:modelValue', [...chosen.value, path]);
};

const remove = (path: string): void => {
  emit(
    'update:modelValue',
    chosen.value.filter((candidate) => candidate !== path)
  );
};
</script>

<style scoped>
.field-path-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.field-path-select__chosen {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.field-path-select__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  border-radius: var(--theme--border-radius, 6px);
  background: var(--theme--background-normal, #f0f4f9);
  color: var(--theme--foreground, #172940);
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

.field-path-select__placeholder {
  color: var(--theme--foreground-subdued, #a2b5cd);
}

.field-path-select__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-path-select__remove,
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

.field-path-select__remove:hover,
.field-path-select__clear:hover {
  color: var(--theme--danger, #e35169);
}
</style>
