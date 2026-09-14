<template>
  <v-button
    v-if="selectedItems.length > 0"
    v-tooltip="t('deleteSelected')"
    class="delete-btn"
    icon
    rounded
    @click="confirmVisible = true"
  >
    <v-icon name="delete" />
  </v-button>

  <v-dialog v-model="confirmVisible" @esc="confirmVisible = false">
    <v-card>
      <v-card-title>{{ t('deleteConfirmTitle', { count: selectedItems.length }) }}</v-card-title>
      <v-card-text>{{ t('deleteConfirmBody') }}</v-card-text>
      <v-card-text v-if="failure" class="failure">{{ failure }}</v-card-text>
      <v-card-actions>
        <v-button secondary :disabled="deleting" @click="confirmVisible = false">
          {{ t('cancel') }}
        </v-button>
        <v-button danger :loading="deleting" @click="executeDelete">
          {{ t('confirmDelete') }}
        </v-button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { DeleteActionProps } from './DeleteAction.types';

const props = defineProps<DeleteActionProps>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const confirmVisible = ref(false);
const deleting = ref(false);
const failure = ref<string | null>(null);

watch(confirmVisible, (visible) => {
  if (!visible) failure.value = null;
});

/**
 * A exclusao e irreversivel e passa pela rede, entao o dialogo so fecha quando
 * ela terminou. Sem isso um erro da api rejeitava calado e o dialogo sumia como
 * se tivesse dado certo.
 */
const executeDelete = async (): Promise<void> => {
  if (deleting.value) return;

  deleting.value = true;
  failure.value = null;

  try {
    await props.deleteSelectedItems();
    confirmVisible.value = false;
  } catch (error) {
    failure.value = t('deleteFailed', {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
.failure {
  color: var(--theme--danger);
}

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
