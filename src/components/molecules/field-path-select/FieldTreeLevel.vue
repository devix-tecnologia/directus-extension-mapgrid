<template>
  <ul class="field-tree-level" :class="{ 'field-tree-level--nested': props.parent }">
    <li v-for="node in nodes" :key="node.path" class="field-tree-level__row">
      <button
        type="button"
        class="field-tree-level__item"
        :class="{ 'field-tree-level__item--chosen': node.path === props.chosen }"
        :data-field-tree-node="node.path"
        :aria-expanded="node.selectable ? undefined : open.has(node.path)"
        @click="press(node)"
      >
        <span class="field-tree-level__name">{{ node.name }}</span>
        <v-icon
          v-if="!node.selectable"
          :name="open.has(node.path) ? 'expand_more' : 'chevron_right'"
          small
        />
      </button>
      <field-tree-level
        v-if="!node.selectable && node.opensInto && open.has(node.path)"
        :collection="node.opensInto"
        :parent="node"
        :nodes-of="props.nodesOf"
        :chosen="props.chosen"
        @choose="emit('choose', $event)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { FieldTreeNode } from '../../../services/field-tree/index';

const props = defineProps<{
  collection: string;
  parent?: FieldTreeNode;
  nodesOf: (collection: string, parent?: FieldTreeNode) => FieldTreeNode[];
  chosen?: string | null;
}>();
const emit = defineEmits<{ choose: [path: string] }>();

const nodes = computed(() => props.nodesOf(props.collection, props.parent));
const open = reactive(new Set<string>());

const press = (node: FieldTreeNode): void => {
  if (node.selectable) {
    emit('choose', node.path);
    return;
  }
  if (open.has(node.path)) open.delete(node.path);
  else open.add(node.path);
};
</script>

<style scoped>
.field-tree-level {
  margin: 0;
  padding: 4px;
  list-style: none;
}

.field-tree-level--nested {
  padding: 0 0 0 16px;
}

.field-tree-level__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 36px;
  padding: 0 8px 0 12px;
  border: 0;
  border-radius: var(--theme--border-radius, 6px);
  background: none;
  color: var(--theme--foreground, #172940);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.field-tree-level__item:hover {
  background: var(--theme--background-normal, #f0f4f9);
}

.field-tree-level__item--chosen {
  color: var(--theme--primary, #6644ff);
}

.field-tree-level__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
