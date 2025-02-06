import {
  defineLayout,
  useCollection,
  useSync,
  useItems,
} from "@directus/extensions-sdk";
import Layout from "./layout.vue"; // Componente Vue personalizado
import { LayoutOptions, LayoutQuery } from "./types";
import { computed, toRefs } from "vue";
import Options from "./options.vue";

export default defineLayout<LayoutOptions, LayoutQuery | null>({
  id: "mapgrid",
  name: "MapGrid",
  icon: "map",
  component: Layout, // Usaremos o layout.vue para customizar a tabela
  slots: {
    options: Options,
    sidebar: () => undefined,
    actions: undefined,
  },
  setup(props, { emit }) {
    const layoutOptions = useSync(props, "layoutOptions", emit);
    const layoutQuery = useSync(props, "layoutQuery", emit);

    const { collection, filter, search } = toRefs(props);
    const { primaryKeyField, fields: fieldsInCollection } =
      useCollection(collection);
    const { sort, limit, page, fields } = useLayoutQuery();

    // Aqui, os campos a serem usados na listagem
    const { title, coluna1, coluna2, coluna3, coluna4, coluna5 } =
      useLayoutOptions();

    const { items, loading, error, totalPages, itemCount, totalCount } =
      useItems(collection, {
        sort,
        limit,
        page,
        fields,
        filter,
        search,
      });

    // Aqui, os campos a serem usados na listagem
    function useLayoutOptions() {
      const title = createViewOption<string | null>("title", null);
      const coluna1 = createViewOption<string | null>("coluna1", null);
      const coluna2 = createViewOption<string | null>("coluna2", null);
      const coluna3 = createViewOption<string | null>("coluna3", null);
      const coluna4 = createViewOption<string | null>("coluna4", null);
      const coluna5 = createViewOption<string | null>("coluna5", null);

      return {
        title,
        coluna1,
        coluna2,
        coluna3,
        coluna4,
        coluna5,
      };

      function createViewOption<T>(
        key: keyof LayoutOptions,
        defaultValue: any
      ) {
        return computed<T>({
          get() {
            return layoutOptions.value?.[key] !== undefined
              ? layoutOptions.value?.[key]
              : defaultValue;
          },
          set(newValue: T) {
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
        return fieldsInCollection.value
          ? fieldsInCollection.value.map((field) => field.field)
          : [];
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
      coluna1,
      coluna2,
      coluna3,
      coluna4,
      coluna5,
    };
  },
});

//funciona
