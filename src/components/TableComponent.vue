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
let lastSelectedIndex = ref(-1);

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

// Função para selecionar um item e rolar até ele
const selectItem = (id) => {
  console.log('Selecting item with ID:', id);
  const newIndex = props.items.findIndex((item) => item.id === id);
  console.log('New index:', newIndex, 'Last index:', lastSelectedIndex.value);

  selectedItemId.value = id;

  nextTick(() => {
    setTimeout(() => {
      if (tableContainer.value) {
        const selectedRow = tableContainer.value.querySelector(`[data-id="${id}"]`);

        if (selectedRow) {
          console.log('Found selected row:', selectedRow);

          const container = tableContainer.value;
          const rowRect = selectedRow.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          // Calcula a posição do scroll para centralizar o item
          const scrollOffset =
            selectedRow.offsetTop - container.clientHeight / 2 + selectedRow.clientHeight / 2;

          container.scrollTo({
            top: scrollOffset,
            behavior: 'smooth',
          });

          lastSelectedIndex.value = newIndex;
        } else {
          console.log('Selected row not found for ID:', id);
        }
      } else {
        console.log('No table container found');
      }
    }, 50);
  });
};

// Expor a função para o componente pai
defineExpose({ selectItem });
</script>

<style scoped>
.table-container {
  height: 40%;
  overflow-y: auto;
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  position: relative;
}

.table-container :deep(.v-table) {
  --v-table-background-color: var(--theme--background);
  --v-table-header-background-color: var(--theme--background-subdued);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 8px;
}

.edit-icon {
  opacity: 0;
  transition: opacity var(--medium) var(--transition);
  --v-icon-color: var(--theme--primary);
  --v-icon-color-hover: var(--theme--primary);
}

.table-container :deep(tr:hover) .edit-icon {
  opacity: 1;
}

.table-container :deep(tr.selected),
.table-container :deep(tr:has(.selected-row)) {
  background-color: var(--theme--primary-background) !important;
  border-left: 4px solid var(--theme--primary);
}

.selected-row {
  font-weight: 600;
}

/* Scrollbar styling */
.table-container::-webkit-scrollbar {
  width: 8px;
  background-color: transparent;
}

.table-container::-webkit-scrollbar-track {
  background-color: transparent;
}

.table-container::-webkit-scrollbar-thumb {
  background-color: var(--theme--primary);
  border-radius: var(--theme--border-radius);
}
</style>
