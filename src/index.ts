import {
  defineLayout,
  useCollection,
  useSync,
  useItems,
} from "@directus/extensions-sdk";
import Layout from "./layout.vue"; // Componente Vue personalizado
import { LayoutOptions, LayoutQuery } from "./types";
import { computed, toRefs } from "vue";

export default defineLayout<LayoutOptions, LayoutQuery | null>({
  id: "custom_table_layout",
  name: "Tabela Personalizada",
  icon: "table_chart",
  component: Layout, // Usaremos o layout.vue para customizar a tabela
  slots: {
    options: undefined,
    sidebar: () => undefined,
    actions: undefined,
  },
  setup(props, { emit }) {
    const layoutOptions = useSync(props, "layoutOptions", emit);
    const layoutQuery = useSync(props, "layoutQuery", emit);

    const { collection, filter, search } = toRefs(props);

    const { fields: fieldsInCollection } = useCollection(collection);

    const { sort, limit, page, fields } = useLayoutQuery();

    const { items, loading, error, totalPages, itemCount, totalCount } =
      useItems(collection, {
        sort,
        limit,
        page,
        fields,
        filter,
        search,
      });

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
    };
  },
});

//funciona
