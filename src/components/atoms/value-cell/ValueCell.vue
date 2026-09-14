<template>
  <span class="value-cell">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { serializeValue } from '../../../services/value-formatter/index';
import type { ValueCellProps } from './ValueCell.types';

const props = defineProps<ValueCellProps>();

const text = computed(() => serializeValue(props.value));
</script>

<script lang="ts">
export default {
  name: 'ValueCell',
};
</script>

<style scoped>
.value-cell {
  font-size: 14px;
}
</style>
