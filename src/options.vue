<template>
  <div class="field">
    <div class="type-label">Title Pin Map</div>
    <v-select
      v-model="title"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...fieldsInCollection]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>
  <!-- Coluna 1 -->
  <div class="field">
    <div class="type-label">Col 1</div>
    <v-select
      v-model="coluna1"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...fieldsInCollection]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>

  <!-- Coluna 2 -->
  <div class="field">
    <div class="type-label">Col 2</div>
    <v-select
      v-model="coluna2"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...fieldsInCollection]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>

  <!-- Coluna 3 -->
  <div class="field">
    <div class="type-label">Col 3</div>
    <v-select
      v-model="coluna3"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...fieldsInCollection]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>

  <!-- Coluna 4 -->
  <div class="field">
    <div class="type-label">Col 4</div>
    <v-select
      v-model="coluna4"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...fieldsInCollection]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>

  <!-- Coluna 5 -->
  <div class="field">
    <div class="type-label">Col 5</div>
    <v-select
      v-model="coluna5"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...fieldsInCollection]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed } from 'vue';
import { useCollection, useSync } from '@directus/extensions-sdk';
import { LayoutOptions } from './types';

export default defineComponent({
  name: 'Options',
  props: {
    collection: { type: String, required: true },
    layoutOptions: { type: Object as () => LayoutOptions, required: true },
    fieldsInCollection: { type: Array, required: true },
    title: { type: String, default: null },
    coluna1: { type: String, default: null },
    coluna2: { type: String, default: null },
    coluna3: { type: String, default: null },
    coluna4: { type: String, default: null },
    coluna5: { type: String, default: null },
  },
  emits: [
    'update:layoutOptions',
    'update:title',
    'update:coluna1',
    'update:coluna2',
    'update:coluna3',
    'update:coluna4',
    'update:coluna5',
  ],
  setup(props, { emit }) {
    const { collection: collectionKey } = toRefs(props);
    const collection = useCollection(collectionKey);

    const title = useSync(props, 'title', emit);
    const coluna1 = useSync(props, 'coluna1', emit);
    const coluna2 = useSync(props, 'coluna2', emit);
    const coluna3 = useSync(props, 'coluna3', emit);
    const coluna4 = useSync(props, 'coluna4', emit);
    const coluna5 = useSync(props, 'coluna5', emit);

    const layoutOptions = useSync(props, 'layoutOptions', emit);

    const iconTemplateWritable = computed({
      get() {
        return layoutOptions.value?.iconTemplate;
      },
      set(newValue) {
        layoutOptions.value = Object.assign({}, layoutOptions.value, {
          iconTemplate: newValue,
        });
      },
    });

    const headerTemplateWritable = computed({
      get() {
        return layoutOptions.value?.headerTemplate;
      },
      set(newValue) {
        layoutOptions.value = Object.assign({}, layoutOptions.value, {
          headerTemplate: newValue,
        });
      },
    });

    const cardContentTemplateWritable = computed({
      get() {
        return layoutOptions.value?.cardContentTemplate;
      },
      set(newValue) {
        layoutOptions.value = Object.assign({}, layoutOptions.value, {
          cardContentTemplate: newValue,
        });
      },
    });

    return {
      iconTemplateWritable,
      headerTemplateWritable,
      cardContentTemplateWritable,

      title,
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,
    };
  },
});
</script>

<style scoped>
.options-container {
  padding: 16px;
  width: 100%;
  display: block;
}
.field {
  margin-bottom: 16px;
  width: 100%;
  display: block;
}
.type-label {
  font-weight: bold;
  margin-bottom: 4px;
}
</style>
