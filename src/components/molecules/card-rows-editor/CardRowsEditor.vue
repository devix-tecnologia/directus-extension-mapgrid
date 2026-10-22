<template>
  <div class="card-rows-editor">
    <ol v-if="props.modelValue.length" class="card-rows-editor__rows">
      <li
        v-for="(row, index) in props.modelValue"
        :key="index"
        class="card-rows-editor__row"
        data-card-row
      >
        <div class="card-rows-editor__fields">
          <v-input
            :model-value="row.label ?? ''"
            :placeholder="props.labelFor?.(row.template) || t('cardRowLabel')"
            data-card-row-label
            @update:model-value="update(index, { label: String($event ?? '') || undefined })"
          />
          <v-collection-field-template
            :collection="props.collection"
            :model-value="row.template"
            :placeholder="t('cardRowTemplate')"
            data-card-row-template
            @update:model-value="update(index, { template: String($event ?? '') })"
          />
        </div>
        <div class="card-rows-editor__actions">
          <button
            type="button"
            data-card-row-up
            :disabled="index === 0"
            :aria-label="t('cardRowUp')"
            @click="move(index, -1)"
          >
            <v-icon name="arrow_upward" small />
          </button>
          <button
            type="button"
            data-card-row-down
            :disabled="index === props.modelValue.length - 1"
            :aria-label="t('cardRowDown')"
            @click="move(index, 1)"
          >
            <v-icon name="arrow_downward" small />
          </button>
          <button
            type="button"
            data-card-row-remove
            :aria-label="t('cardRowRemove')"
            @click="remove(index)"
          >
            <v-icon name="close" small />
          </button>
        </div>
      </li>
    </ol>
    <button type="button" class="card-rows-editor__add" data-card-row-add @click="add">
      <v-icon name="add" small />
      <span>{{ t('cardRowAdd') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { CardRowOption } from '../../../services/card-rows/index';
import { MESSAGES } from '../../../shared/messages';
import type { CardRowsEditorEmits, CardRowsEditorProps } from './CardRowsEditor.types';

const props = defineProps<CardRowsEditorProps>();
const emit = defineEmits<CardRowsEditorEmits>();
const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const write = (rows: CardRowOption[]): void => emit('update:modelValue', rows);

const update = (index: number, change: Partial<CardRowOption>): void =>
  write(props.modelValue.map((row, at) => (at === index ? { ...row, ...change } : row)));

const remove = (index: number): void => write(props.modelValue.filter((_, at) => at !== index));

const move = (index: number, step: -1 | 1): void => {
  const rows = [...props.modelValue];
  const target = index + step;
  const [row] = rows.splice(index, 1);
  if (!row || target < 0 || target > rows.length) return;
  rows.splice(target, 0, row);
  write(rows);
};

const add = (): void => write([...props.modelValue, { template: '' }]);
</script>

<style scoped>
.card-rows-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-rows-editor__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card-rows-editor__row {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-radius: var(--theme--border-radius, 6px);
  background: var(--theme--background-normal, #f0f4f9);
}

.card-rows-editor__fields {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-rows-editor__actions {
  display: flex;
  flex-direction: column;
}

.card-rows-editor__actions button,
.card-rows-editor__add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border: 0;
  background: none;
  color: var(--theme--foreground-subdued, #a2b5cd);
  font: inherit;
  cursor: pointer;
}

.card-rows-editor__actions button:hover:not(:disabled),
.card-rows-editor__add:hover {
  color: var(--theme--primary, #6644ff);
}

.card-rows-editor__actions button:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
