import { defineLayout, useApi, useCollection, useItems, useSync } from '@directus/extensions-sdk';
import type { Field } from '@directus/types';
import type { MaybeRefOrGetter } from 'vue';
import { computed, ref, toRefs, toValue } from 'vue';
import DeleteAction from './components/atoms/delete-action/DeleteAction.vue';
import Layout from './components/templates/mapgrid-layout/MapgridLayout.vue';
import Options from './components/templates/mapgrid-options/MapgridOptions.vue';
import type { GeoItem } from './services/geo/index.js';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './services/geo/index.js';
import type { LayoutOptions, LayoutQuery } from './types.js';

const EXCLUDED_FIELDS = [
  'id',
  'sort',
  'status',
  'user_created',
  'date_created',
  'user_updated',
  'date_updated',
];

interface DetectedField {
  field: string;
  type?: string;
  name?: string;
  meta?: { interface?: string; hidden?: boolean };
}

const toDetectedField = (field: Field): DetectedField => ({
  field: field.field,
  type: field.type,
  name: field.name ?? field.field,
  meta: field.meta
    ? {
        interface: field.meta.interface ?? undefined,
        hidden: field.meta.hidden ?? undefined,
      }
    : undefined,
});

const detectGeolocationField = (fields: DetectedField[]): string | undefined => {
  const mapField = fields.find((field) => field.meta?.interface === 'map');
  if (mapField) return mapField.field;
  const jsonField = fields.find(
    (field) => field.type === 'json' && !EXCLUDED_FIELDS.includes(field.field)
  );
  return jsonField?.field;
};

const detectStringFields = (fields: DetectedField[]): string[] =>
  fields
    .filter(
      (field) =>
        field.type === 'string' && !EXCLUDED_FIELDS.includes(field.field) && !field.meta?.hidden
    )
    .map((field) => field.field);

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

    const detectedFields = computed<DetectedField[]>(() =>
      (fieldsInCollection.value ?? []).map(toDetectedField)
    );

    const detectedGeo = computed(() => detectGeolocationField(detectedFields.value));
    const detectedStringFields = computed(() => detectStringFields(detectedFields.value));
    const detectedTitle = computed(() => {
      const first = detectedStringFields.value[0];
      return first ? `{{${first}}}` : undefined;
    });

    const layoutOptionBindings = createLayoutOptions();

    const { items, loading, error, totalPages, itemCount, totalCount } = useItems(collection, {
      sort,
      limit,
      page,
      fields,
      filter,
      search,
    });

    const selectedItems = ref<GeoItem[]>([]);

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
      const title = createViewOption('title', detectedTitle);
      const zoomOnClick = createViewOption('zoomOnClick');
      const geolocation = createViewOption('geolocation', detectedGeo);
      const [defaultLng, defaultLat] = DEFAULT_MAP_CENTER;
      const mapCenterLng = createViewOption('mapCenterLng', defaultLng);
      const mapCenterLat = createViewOption('mapCenterLat', defaultLat);
      const mapZoom = createViewOption('mapZoom', DEFAULT_MAP_ZOOM);
      const columnKeys = ['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5'] as const;
      const [coluna1, coluna2, coluna3, coluna4, coluna5] = columnKeys.map((key, index) =>
        createViewOption(
          key,
          computed(() => detectedStringFields.value[index])
        )
      );

      return {
        title,
        zoomOnClick,
        geolocation,
        mapCenterLng,
        mapCenterLat,
        mapZoom,
        coluna1,
        coluna2,
        coluna3,
        coluna4,
        coluna5,
      };

      function createViewOption<Key extends keyof LayoutOptions>(
        key: Key,
        defaultValue?: MaybeRefOrGetter<LayoutOptions[Key] | undefined>
      ) {
        return computed<LayoutOptions[Key] | undefined>({
          get() {
            const configuredValue = layoutOptions.value?.[key];
            if (configuredValue !== undefined) return configuredValue;
            return toValue(defaultValue);
          },
          set(newValue: LayoutOptions[Key]) {
            layoutOptions.value = { ...layoutOptions.value, [key]: newValue };
          },
        });
      }
    }

    function useLayoutQuery() {
      const page = computed(() => layoutQuery.value?.page || 1);
      const limit = computed(() => layoutQuery.value?.limit || 25);
      const sort = computed(() => layoutQuery.value?.sort || []);

      const fields = computed(() =>
        fieldsInCollection.value ? fieldsInCollection.value.map((field) => field.field) : []
      );

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
      selectedItems,
      deleteSelectedItems,
      ...layoutOptionBindings,
    };
  },
});
