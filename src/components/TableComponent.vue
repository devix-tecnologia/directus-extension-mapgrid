<template>
  <div class="table-container" ref="tableContainer">
    <v-table
      v-if="items && items.length > 0"
      :headers="resolvedHeaders"
      :items="items"
      :show-select="false"
      :show-resize="true"
      fixed-header
      @click:row="handleRowClick"
    >
      <template #[`item.actions`]="{ item }">
        <div class="actions">
          <v-icon
            v-tooltip="'Edit'"
            class="edit-icon"
            name="edit"
            small
            clickable
            @click.stop="emit('edit-item', item)"
          />
        </div>
      </template>

      <template v-for="header in headers" :key="header.value" #[`item.${header.value}`]="{ item }">
        <span :class="{ 'selected-row': selectedItemId === item.id }">
          {{ renderCellValue(item, header.value) }}
        </span>
      </template>
    </v-table>

    <v-info v-else icon="search" title="No items found" center />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';

interface Header {
  text: string;
  value: string;
}

interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

const props = defineProps<{
  items: RowItem[];
  headers: Header[];
  collection: string;
}>();

const emit = defineEmits<{
  'focus-on-item': [item: RowItem];
  'edit-item': [item: RowItem];
}>();

const selectedItemId = ref<string | number | null>(null);
const tableContainer = ref<HTMLDivElement | null>(null);

const resolvedHeaders = computed(() => [
  ...props.headers.map((header) => ({
    text: header.text,
    value: header.value,
    sortable: true,
    width: null as number | null,
  })),
  { text: 'Actions', value: 'actions', sortable: false, width: 100, align: 'right' },
]);

const serializeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if ('coordinates' in (value as Record<string, unknown>)) {
    const geo = value as { coordinates: [number, number] };
    return `${geo.coordinates[1]}, ${geo.coordinates[0]}`;
  }
  return JSON.stringify(value);
};

const renderCellValue = (item: RowItem, field: string): string => {
  if (!item || !field) return '';
  if (!Object.prototype.hasOwnProperty.call(item, field)) return '';
  return serializeValue(item[field]);
};

const handleRowClick = ({ item }: { item: RowItem }): void => {
  emit('focus-on-item', item);
  selectedItemId.value = item.id;
};

const selectItem = (id: string | number): void => {
  selectedItemId.value = id;

  nextTick(() => {
    setTimeout(() => {
      if (!tableContainer.value) return;

      const selectedRow = tableContainer.value.querySelector(`[data-id="${id}"]`);
      if (!selectedRow) return;

      const row = selectedRow as HTMLElement;
      const container = tableContainer.value;
      const scrollOffset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;

      container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    }, 50);
  });
};

defineExpose({ selectItem });
</script>

<style scoped>
.table-container {
  height: 40%;
  overflow-y: auto;
  position: relative;
}

.table-container :deep(.v-table) {
  --v-table-background-color: transparent;
  --v-table-header-background-color: var(--theme--background-subdued);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--form-horizontal-gap);
  padding: 0 var(--form-horizontal-gap);
}

.edit-icon {
  opacity: 0;
  transition: opacity var(--transition-fast) var(--transition);
  --v-icon-color: var(--theme--foreground-subdued);
  --v-icon-color-hover: var(--theme--primary);
}

.table-container :deep(tr:hover) .edit-icon {
  opacity: 1;
}

.table-container :deep(tr:has(.selected-row)) {
  background-color: var(--theme--primary-background) !important;
}

.selected-row {
  font-weight: 600;
  color: var(--theme--primary);
}

.table-container::-webkit-scrollbar {
  width: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: var(--theme--background-subdued);
  border-radius: var(--theme--border-radius);
}

.table-container::-webkit-scrollbar-thumb {
  background: var(--theme--foreground-subdued);
  border-radius: var(--theme--border-radius);
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: var(--theme--foreground);
}
</style>
