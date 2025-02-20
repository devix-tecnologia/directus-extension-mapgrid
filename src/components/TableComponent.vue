<template>
  <div class="table-container">
    <div class="table-header">
      <div v-for="header in headers" :key="header.value" class="table-header-item">
        {{ header.text }}
      </div>
    </div>

    <div
      v-for="item in items"
      v-if="items && items.length > 0"
      :key="item.id"
      class="table-row item-lista"
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
    <div v-else class="no-items-message">No items found.</div>
  </div>
</template>

<script setup>
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

const formatValue = (item, field) => {
  if (!item || !field) return '';
  if (!Object.prototype.hasOwnProperty.call(item, field)) return '';
  const value = item[field];
  return value === null || value === undefined ? '' : value;
};
</script>

<style scoped>
.table-container {
  height: 40%;
  overflow-y: auto;
  background: var(--theme--background);
  border-radius: 8px;
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
