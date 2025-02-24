<template>
  <div class="field">
    <div class="type-label">Popup Pin Map</div>
    <v-collection-field-template v-model="title" :collection="collection" />
  </div>
  <div class="field">
    <div class="type-label">Geolocation</div>
    <v-select
      v-model="geolocation"
      :collection="collection"
      :items="[{ name: '---', field: null }, ...camposSelecao]"
      item-text="name"
      item-value="field"
      placeholder="Select a field"
    />
  </div>
  <!-- Checkbox antes de Col 1 -->
  <div class="field">
    <div class="type-label">Zoom on Table Click</div>
    <v-checkbox
      v-model="localZoomOnClick"
      label="Zoom when clicking table items"
      @update:modelValue="updateZoomOnClick"
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
    const collection = useCollection(collectionKey);

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

    const updateZoomOnClick = (newValue) => {
      console.log('Zoom on Click updated:', newValue); // Debug
      emit('update:zoomOnClick', newValue);
    };

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

    const camposSelecao = computed(() =>
      collection.fields.value.filter((f) => f.meta?.interface === 'map')
    );

    return {
      iconTemplateWritable,
      headerTemplateWritable,
      cardContentTemplateWritable,
      camposSelecao,

      title,
      geolocation,
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,
      localZoomOnClick, // Usado no v-model do checkbox
      updateZoomOnClick,
    };
  },
});
</script>

<style scoped>
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
