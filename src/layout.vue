<template>
  <div class="directus-table-layout">
    <v-info v-if="loading" icon="refresh" title="Loading..." center>
      <template #append>
        <v-progress-circular indeterminate />
      </template>
    </v-info>

    <div v-else class="layout-container">
      <MapComponent
        ref="mapComponent"
        :items="items"
        :geolocation="geolocation"
        :title="title"
        :zoom-on-click="zoomOnClick"
        @select-item="handleSelectItem"
      />
      <TableComponent
        ref="tableComponent"
        :items="items"
        :headers="headers"
        :collection="collection"
        @focus-on-item="handleFocusOnItem"
        @edit-item="editItem"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import MapComponent from './components/MapComponent.vue';
import TableComponent from './components/TableComponent.vue';

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  collection: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'name',
  },
  geolocation: {
    type: String,
    default: 'geolocation',
  },
  coluna1: String,
  coluna2: String,
  coluna3: String,
  coluna4: String,
  coluna5: String,
  zoomOnClick: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const mapComponent = ref(null);
const tableComponent = ref(null);

const headers = computed(() => {
  const columns = [
    props.coluna1,
    props.coluna2,
    props.coluna3,
    props.coluna4,
    props.coluna5,
  ].filter(Boolean);

  return columns.map((column) => ({
    text: column,
    value: column,
  }));
});

const handleFocusOnItem = (item) => {
  if (mapComponent.value) {
    mapComponent.value.focusOnItem(item);
  }
};

const handleSelectItem = (id) => {
  if (tableComponent.value) {
    tableComponent.value.selectItem(id);
  }
};

const editItem = (item) => {
  router.push(`/content/${props.collection}/${item.id}`);
};
</script>

<style scoped>
.directus-table-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  position: relative;
  padding: var(--content-padding);
  padding-top: 0;
  padding-bottom: var(--content-padding-bottom);
}

.layout-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--content-padding);
}
</style>
