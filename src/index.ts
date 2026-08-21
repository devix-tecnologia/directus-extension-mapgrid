import { defineLayout, useApi, useCollection, useItems, useSync } from '@directus/extensions-sdk';
import { computed, ref, toRefs } from 'vue';
import DeleteAction from './components/atoms/DeleteAction.vue';
import Options from './components/molecules/MapGridOptions.vue';
import Layout from './components/templates/MapGridLayout.vue';
import type { LayoutOptions, LayoutQuery, RowItem } from './types.js';

const EXCLUDED_FIELDS = ['id', 'sort', 'status', 'user_created', 'date_created', 'user_updated', 'date_updated'];

interface FieldMeta {
  field: string;
  type?: string;
  name?: string;
  meta?: { interface?: string; hidden?: boolean };
}

function detectGeolocationField(fields: FieldMeta[]): string | undefined {
  const mapField = fields.find((f) => f.meta?.interface === 'map');
  if (mapField) return mapField.field;
  const jsonField = fields.find((f) => f.type === 'json' && !EXCLUDED_FIELDS.includes(f.field));
  return jsonField?.field;
}

function detectStringFields(fields: FieldMeta[]): string[] {
  return fields
    .filter((f) => f.type === 'string' && !EXCLUDED_FIELDS.includes(f.field) && !f.meta?.hidden)
    .map((f) => f.field);
}

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

    const detectedFields = computed(() => {
      if (!fieldsInCollection.value) return [] as FieldMeta[];
      return fieldsInCollection.value.map((f: Record<string, unknown>) => ({
        field: f.field as string,
        type: f.type as string | undefined,
        name: (f.name ?? f.field) as string | undefined,
        meta: f.meta as { interface?: string; hidden?: boolean } | undefined,
      }));
    });

    const detectedGeo = computed(() => detectGeolocationField(detectedFields.value));
    const detectedStringFields = computed(() => detectStringFields(detectedFields.value));
    const detectedTitle = computed(() => {
      const first = detectedStringFields.value[0];
      return first ? `{{${first}}}` : undefined;
    });

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
    } = createLayoutOptions();

    const { items, loading, error, totalPages, itemCount, totalCount } = useItems(collection, {
      sort,
      limit,
      page,
      fields,
      filter,
      search,
    });

    const selectedItems = ref<RowItem[]>([]);

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

    function createLayoutOptions() {
      const title = createViewOption('title', computed(() => detectedTitle.value));
      const zoomOnClick = createViewOption('zoomOnClick', undefined);
      const geolocation = createViewOption('geolocation', computed(() => detectedGeo.value));
      const mapCenterLng = createViewOption('mapCenterLng', -47.9292);
      const mapCenterLat = createViewOption('mapCenterLat', -15.7801);
      const mapZoom = createViewOption('mapZoom', 4);
      const coluna1 = createViewOption('coluna1', computed(() => detectedStringFields.value[0]));
      const coluna2 = createViewOption('coluna2', computed(() => detectedStringFields.value[1]));
      const coluna3 = createViewOption('coluna3', computed(() => detectedStringFields.value[2]));
      const coluna4 = createViewOption('coluna4', computed(() => detectedStringFields.value[3]));
      const coluna5 = createViewOption('coluna5', computed(() => detectedStringFields.value[4]));

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
        defaultValue: LayoutOptions[K] | import('vue').ComputedRef<LayoutOptions[K]>
      ) {
        return computed<LayoutOptions[K]>({
          get() {
            if (layoutOptions.value?.[key] !== undefined) {
              return layoutOptions.value[key];
            }
            return defaultValue && typeof defaultValue === 'object' && 'value' in defaultValue
              ? defaultValue.value
              : (defaultValue as LayoutOptions[K]);
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
