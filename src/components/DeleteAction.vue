<template>
  <v-button
    v-if="selectedItems.length > 0"
    v-tooltip="'Delete selected'"
    class="delete-btn"
    icon
    rounded
    @click="confirmVisible = true"
  >
    <v-icon name="delete" />
  </v-button>

  <v-dialog v-model="confirmVisible" @esc="confirmVisible = false">
    <v-card>
      <v-card-title>Delete {{ selectedItems.length }} item(s)?</v-card-title>
      <v-card-text>This action cannot be undone.</v-card-text>
      <v-card-actions>
        <v-button secondary @click="confirmVisible = false">Cancel</v-button>
        <v-button danger @click="executeDelete">Delete</v-button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

const props = defineProps<{
  selectedItems: RowItem[];
  deleteSelectedItems: () => Promise<void>;
}>();

const confirmVisible = ref(false);

const executeDelete = async (): Promise<void> => {
  await props.deleteSelectedItems();
  confirmVisible.value = false;
};
</script>

<style scoped>
.delete-btn {
  margin-left: 12px;
  --v-button-background-color: var(--theme--background-subdued);
  --v-button-background-color-hover: var(--theme--danger);
}

.delete-btn :deep(.v-icon) {
  --v-icon-color: var(--theme--foreground);
  transition: color var(--transition-fast) var(--transition);
}

.delete-btn:hover :deep(.v-icon) {
  --v-icon-color: #fff !important;
}
</style>
