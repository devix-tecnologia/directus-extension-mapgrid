<template>
  <div class="table-container" ref="tableContainer">
    <v-table
      v-if="items && items.length > 0"
      :headers="tableHeaders"
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
          {{ formatValue(item, header.value) }}
        </span>
      </template>
    </v-table>

    <v-info v-else icon="search" :title="'No items found'" center />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  headers: {
    type: Array,
    required: true,
  },
  collection: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['focus-on-item', 'edit-item']);

const selectedItemId = ref(null);
const tableContainer = ref(null);

const tableHeaders = computed(() => [
  ...props.headers.map((header) => ({
    text: header.text,
    value: header.value,
    sortable: true,
    width: null,
  })),
  {
    text: 'Actions',
    value: 'actions',
    sortable: false,
    width: 100,
    align: 'right',
  },
]);

const formatValue = (item, field) => {
  if (!item || !field) return '';
  if (!Object.prototype.hasOwnProperty.call(item, field)) return '';
  const value = item[field];
  return value === null || value === undefined ? '' : value;
};

const handleRowClick = ({ item }) => {
  emit('focus-on-item', item);
  selectedItemId.value = item.id;
};

const selectItem = (id) => {
  const newIndex = props.items.findIndex((item) => item.id === id);

  selectedItemId.value = id;

  nextTick(() => {
    setTimeout(() => {
      if (tableContainer.value) {
        const selectedRow = tableContainer.value.querySelector(`[data-id="${id}"]`);

        if (selectedRow) {
          const container = tableContainer.value;

          const scrollOffset =
            selectedRow.offsetTop - container.clientHeight / 2 + selectedRow.clientHeight / 2;

          container.scrollTo({
            top: scrollOffset,
            behavior: 'smooth',
          });
        }
      }
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
