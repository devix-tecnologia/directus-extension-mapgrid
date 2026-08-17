<template>
  <div class="field">
    <div class="type-label">
      <v-icon name="info" small left />
      Popup Pin Map
    </div>
    <v-collection-field-template v-model="title" :collection="collection" />
  </div>

  <v-divider />

  <div class="field">
    <div class="type-label">
      <v-icon name="place" small left />
      Geolocation
    </div>
    <v-select
      v-model="geolocation"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...camposSelecao]"
      item-text="name"
      item-value="field"
      placeholder="Select a geolocation field"
      :show-deselect="true"
    />
  </div>

  <v-divider />

  <div class="field">
    <div class="type-label">
      <v-icon name="zoom_in" small left />
      Zoom on Table Click
    </div>
    <v-checkbox
      v-model="localZoomOnClick"
      label="Zoom when clicking table items"
      @update:modelValue="updateZoomOnClick"
    />
  </div>

  <v-divider />

  <div class="field-group">
    <div class="type-label">
      <v-icon name="view_column" small left />
      Table Columns
    </div>

    <div class="field">
      <v-select
        v-model="coluna1"
        :collection="collection"
        :items="[{ name: '---', field: null }, ...fieldsInCollection]"
        item-text="name"
        item-value="field"
        placeholder="Column 1"
        :show-deselect="true"
      />
    </div>

    <div class="field">
      <v-select
        v-model="coluna2"
        :collection="collection"
        :items="[{ name: '---', field: null }, ...fieldsInCollection]"
        item-text="name"
        item-value="field"
        placeholder="Column 2"
        :show-deselect="true"
      />
    </div>

    <div class="field">
      <v-select
        v-model="coluna3"
        :collection="collection"
        :items="[{ name: '---', field: null }, ...fieldsInCollection]"
        item-text="name"
        item-value="field"
        placeholder="Column 3"
        :show-deselect="true"
      />
    </div>

    <div class="field">
      <v-select
        v-model="coluna4"
        :collection="collection"
        :items="[{ name: '---', field: null }, ...fieldsInCollection]"
        item-text="name"
        item-value="field"
        placeholder="Column 4"
        :show-deselect="true"
      />
    </div>

    <div class="field">
      <v-select
        v-model="coluna5"
        :collection="collection"
        :items="[{ name: '---', field: null }, ...fieldsInCollection]"
        item-text="name"
        item-value="field"
        placeholder="Column 5"
        :show-deselect="true"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, computed, ref, watch } from 'vue';
import { useCollection, useSync } from '@directus/extensions-sdk';
import { LayoutOptions } from './types';

export default defineComponent({
  name: 'Options',
  props: {
    collection: { type: String, required: true },
    layoutOptions: { type: Object as () => LayoutOptions, required: true },
    fieldsInCollection: { type: Array, required: true },
    title: { type: String, default: '' },
    geolocation: { type: String, default: null },
    coluna1: { type: String, default: null },
    coluna2: { type: String, default: null },
    coluna3: { type: String, default: null },
    coluna4: { type: String, default: null },
    coluna5: { type: String, default: null },
    zoomOnClick: { type: Boolean, default: false },
  },
  emits: [
    'update:layoutOptions',
    'update:geolocation',
    'update:title',
    'update:coluna1',
    'update:coluna2',
    'update:coluna3',
    'update:coluna4',
    'update:coluna5',
    'update:zoomOnClick',
  ],
  setup(props, { emit }) {
    const { collection: collectionKey } = toRefs(props);
    const collection = useCollection(collectionKey as any);

    const title = useSync(props, 'title', emit);
    const geolocation = useSync(props, 'geolocation', emit);
    const coluna1 = useSync(props, 'coluna1', emit);
    const coluna2 = useSync(props, 'coluna2', emit);
    const coluna3 = useSync(props, 'coluna3', emit);
    const coluna4 = useSync(props, 'coluna4', emit);
    const coluna5 = useSync(props, 'coluna5', emit);

    // Usamos uma ref local para o checkbox e sincronizamos manualmente
    const localZoomOnClick = ref(props.zoomOnClick);

    // Sincroniza a prop inicial e atualiza o pai
    watch(
      () => props.zoomOnClick,
      (newValue) => {
        localZoomOnClick.value = newValue;
      }
    );

    const updateZoomOnClick = (newValue: boolean) => {
      console.log('Zoom on Click updated:', newValue);
      emit('update:zoomOnClick', newValue);
    };

    const camposSelecao = computed(() =>
      collection.fields.value.filter((f: any) => f.meta?.interface === 'map')
    );

    return {
      camposSelecao,
      title,
      geolocation,
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,
      localZoomOnClick,
      updateZoomOnClick,
    };
  },
});
</script>

<style scoped>
.field {
  margin-bottom: var(--form-vertical-gap);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--form-vertical-gap);
}

.type-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--theme--foreground);
}

.type-label .v-icon {
  --v-icon-color: var(--theme--primary);
}
</style>
