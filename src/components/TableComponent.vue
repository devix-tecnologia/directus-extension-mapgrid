<template>
  <div class="table-container" ref="tableContainer">
    <div class="table-header">
      <div v-for="header in headers" :key="header.value" class="table-header-item">
        {{ header.text }}
      </div>
    </div>

    <div v-if="items && items.length > 0">
      <div
        v-for="item in items"
        :key="item.id"
        ref="tableRows"
        :data-id="item.id"
        class="table-row item-lista"
        :class="{ selected: selectedItemId === item.id }"
        @click="emit('focus-on-item', item)"
      >
        <div v-for="header in headers" :key="header.value" class="table-cell">
          {{ formatValue(item, header.value) }}
        </div>
        <div class="actions">
          <VButton
            class="edit-btn"
            rounded
            icon
            outlined
            small
            @click.stop="emit('edit-item', item)"
            title="Edit"
          >
            <VIcon small name="edit" />
          </VButton>
        </div>
      </div>
    </div>
    <div v-else class="no-items-message">No items found.</div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

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

const selectedItemId = ref(null); // Estado para o item selecionado
const tableRows = ref(null); // Referência às linhas da tabela
const tableContainer = ref(null); // Referência ao container da tabela
let lastSelectedIndex = ref(-1); // Último índice selecionado

const formatValue = (item, field) => {
  if (!item || !field) return '';
  if (!Object.prototype.hasOwnProperty.call(item, field)) return '';
  const value = item[field];
  return value === null || value === undefined ? '' : value;
};

// Função para selecionar um item e rolar até ele
const selectItem = (id) => {
  console.log('Selecting item with ID:', id);
  const newIndex = props.items.findIndex((item) => item.id === id);
  console.log('New index:', newIndex, 'Last index:', lastSelectedIndex.value);

  selectedItemId.value = id;

  nextTick(() => {
    setTimeout(() => {
      if (tableRows.value && tableContainer.value) {
        const selectedRow = Array.isArray(tableRows.value)
          ? tableRows.value.find((row) => row.getAttribute('data-id') === id.toString())
          : tableRows.value;

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
        console.log('No table rows or container found');
      }
    }, 50);
  });
};

// Expor a função para o componente pai
defineExpose({ selectItem });
</script>

<style scoped>
/* Works on Chrome, Edge, and Safari */
*::-webkit-scrollbar {
  width: 8px;
  background-color: transparent important;
}

*::-webkit-scrollbar-track {
  /* background: var(--white-color); */
  background-color: transparent !important;
  display: none;
}

*::-webkit-scrollbar-thumb {
  background-color: var(--theme--primary);
  border-radius: 20px;
}

.table-container {
  height: 40%;
  overflow-y: auto;
  background: var(--theme--background);
  border: 1px solid var(--background-normal-alt);
  position: relative;
}

.table-header {
  display: flex;
  position: sticky;
  top: 0;
  background-color: var(--theme--background);
  z-index: 1;
}

.table-header-item {
  flex: 1;
  padding: 12px 16px;
  font-weight: bold;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-bottom: 2px solid var(--background-normal-alt);
  text-transform: uppercase;
  font-size: 12px;
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--background-normal-alt);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
  position: relative;
}

.table-row:hover {
  background-color: var(--theme--primary-background);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.table-row:hover .edit-btn {
  opacity: 1;
}

.table-row.selected {
  background-color: var(--theme--primary-background);
  border-left: 4px solid var(--theme--primary);
}

.table-cell {
  flex: 1;
  padding: 12px 16px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
}

.no-items-message {
  padding: 16px;
  text-align: center;
  color: var(--theme--foreground-subdued);
}
</style>
