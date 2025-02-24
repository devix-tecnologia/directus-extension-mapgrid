import { defineLayout, useCollection, useSync, useItems } from '@directus/extensions-sdk';
import Layout from './layout.vue';
import { LayoutOptions, LayoutQuery } from './types.js';
import { computed, toRefs } from 'vue';
import Options from './options.vue';

export default defineLayout<LayoutOptions, LayoutQuery | null>({
  id: 'mapgrid',
  name: 'MapGrid',
  icon: 'map',
  component: Layout,
  slots: {
    options: Options,
    sidebar: () => undefined,
    actions: () => undefined,
  },
  setup(props, { emit }) {
    const layoutOptions = useSync(props, 'layoutOptions', emit);
    const layoutQuery = useSync(props, 'layoutQuery', emit);

    const { collection, filter, search } = toRefs(props);
    const { fields: fieldsInCollection } = useCollection(collection);
    const { sort, limit, page, fields } = useLayoutQuery();

    // Aqui, os campos a serem usados na listagem
    const { title, geolocation, zoomOnClick, coluna1, coluna2, coluna3, coluna4, coluna5 } =
      useLayoutOptions();

    const { items, loading, error, totalPages, itemCount, totalCount } = useItems(collection, {
      sort,
      limit,
      page,
      fields,
      filter,
      search,
    });

    // Aqui, os campos a serem usados na listagem
    function useLayoutOptions() {
      const title = createViewOption('title', undefined);
      const zoomOnClick = createViewOption('zoomOnClick', undefined);
      const geolocation = createViewOption('geolocation', undefined);
      const coluna1 = createViewOption('coluna1', undefined);
      const coluna2 = createViewOption('coluna2', undefined);
      const coluna3 = createViewOption('coluna3', undefined);
      const coluna4 = createViewOption('coluna4', undefined);
      const coluna5 = createViewOption('coluna5', undefined);

      return {
        title,
        geolocation,
        zoomOnClick,
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
    // até aqui

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
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,
    };
  },
});

//funciona
