import { defineLayout, useApi, useCollection, useItems, useSync } from '@directus/extensions-sdk';
import { computed, ref, toRefs } from 'vue';
import DeleteAction from './components/atoms/DeleteAction.vue';
import Options from './components/molecules/MapGridOptions.vue';
import Layout from './components/templates/MapGridLayout.vue';
import type { LayoutOptions, LayoutQuery } from './types.js';

export default defineLayout<LayoutOptions, LayoutQuery | null>({
  id: 'mapgrid',
  name: 'MapGrid',
  icon: 'map',
  component: Layout,
  slots: {
    options: Options,
    sidebar: () => undefined,
    actions: DeleteAction,
  },
  setup(props, { emit }) {
    const layoutOptions = useSync(props, 'layoutOptions', emit);
    const layoutQuery = useSync(props, 'layoutQuery', emit);
    const api = useApi();

    const { collection, filter, search } = toRefs(props);
    const { fields: fieldsInCollection } = useCollection(collection);
    const { sort, limit, page, fields } = useLayoutQuery();

    const {
      title,
      geolocation,
      zoomOnClick,
      mapCenterLng,
      mapCenterLat,
      mapZoom,
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,
    } = useLayoutOptions();

    const { items, loading, error, totalPages, itemCount, totalCount } = useItems(collection, {
      sort,
      limit,
      page,
      fields,
      filter,
      search,
    });

    const selectedItems = ref<{ id: string | number; [key: string]: unknown }[]>([]);

    const deleteItems = async (ids: (string | number)[]) => {
      await api.delete(`/items/${collection.value}`, { data: ids });
      items.value = items.value.filter((item) => !ids.includes(item.id));
    };

    const deleteSelectedItems = async () => {
      if (!selectedItems.value.length) return;
      const ids = selectedItems.value.map((item) => item.id);
      await deleteItems(ids);
      selectedItems.value = [];
    };

    function useLayoutOptions() {
      const title = createViewOption('title', undefined);
      const zoomOnClick = createViewOption('zoomOnClick', undefined);
      const geolocation = createViewOption('geolocation', undefined);
      const mapCenterLng = createViewOption('mapCenterLng', -47.9292);
      const mapCenterLat = createViewOption('mapCenterLat', -15.7801);
      const mapZoom = createViewOption('mapZoom', 4);
      const coluna1 = createViewOption('coluna1', undefined);
      const coluna2 = createViewOption('coluna2', undefined);
      const coluna3 = createViewOption('coluna3', undefined);
      const coluna4 = createViewOption('coluna4', undefined);
      const coluna5 = createViewOption('coluna5', undefined);

      return {
        title,
        geolocation,
        zoomOnClick,
        mapCenterLng,
        mapCenterLat,
        mapZoom,
        coluna1,
        coluna2,
        coluna3,
        coluna4,
        coluna5,
      };

      function createViewOption<K extends keyof LayoutOptions>(
        key: K,
        defaultValue: LayoutOptions[K]
      ) {
        return computed<LayoutOptions[K]>({
          get() {
            return layoutOptions.value?.[key] !== undefined
              ? layoutOptions.value[key]
              : defaultValue;
          },
          set(newValue: LayoutOptions[K]) {
            layoutOptions.value = {
              ...layoutOptions.value,
              [key]: newValue,
            };
          },
        });
      }
    }

    function useLayoutQuery() {
      const page = computed(() => layoutQuery.value?.page || 1);
      const limit = computed(() => layoutQuery.value?.limit || 25);
      const sort = computed(() => layoutQuery.value?.sort || []);

      const fields = computed(() => {
        return fieldsInCollection.value ? fieldsInCollection.value.map((field) => field.field) : [];
      });

      return { sort, limit, page, fields };
    }

    return {
      items,
      loading,
      error,
      totalPages,
      itemCount,
      totalCount,
      page,
      limit,
      fields,
      fieldsInCollection,

      title,
      geolocation,
      zoomOnClick,
      mapCenterLng,
      mapCenterLat,
      mapZoom,
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,

      selectedItems,
      deleteSelectedItems,
    };
  },
});
