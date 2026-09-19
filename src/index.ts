import { defineLayout, useApi, useCollection, useItems, useSync } from '@directus/extensions-sdk';
import type { Field } from '@directus/types';
import type { MaybeRefOrGetter } from 'vue';
import { computed, ref, toRefs, toValue } from 'vue';
import DeleteAction from './components/atoms/delete-action/DeleteAction.vue';
import Layout from './components/templates/mapgrid-layout/SPIKE-tabular-embed.vue';
import Options from './components/templates/mapgrid-options/MapgridOptions.vue';
import type { GeoItem } from './contract/index';
import { fieldsToFetch, normalizeLayoutOptions, useWritableLayoutQuery } from './contract/index';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './services/geo/index';
import type { LayoutOptions, LayoutQuery } from './types';

/** How many string fields to offer as columns before the user picks their own. */
const DEFAULT_COLUMN_COUNT = 5;

/**
 * Directus bookkeeping fields. They serve neither as a title nor as a column,
 * and picking one as a default would only mean changing it on every new
 * collection.
 */
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
    const { fields: fieldsInCollection, primaryKeyField } = useCollection(collection);
    /*
     * Criado antes de qualquer uso: tanto `useLayoutQuery()` quanto
     * `createLayoutOptions()` leem daqui, e uma `const` referenciada antes da
     * linha que a declara derruba o `setup` inteiro por zona morta temporal —
     * o layout nao monta e nem o mapa aparece.
     */
    const writableQuery = useWritableLayoutQuery(layoutQuery);

    const { sort, limit, page, fields: queryFields } = useLayoutQuery();

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

    /*
     * SPIKE v5: o `useItems` daqui saiu de proposito. A v4 mediu duas buscas ao
     * backend — a nossa e a do layout embutido — e a proposta do v5 e ter uma
     * so, a dele, com o `layoutQuery` que nos entregamos. Deixar esta chamada
     * de pe faria a contagem de consultas mentir.
     *
     * `queryFields` fica sem uso aqui, e e isso mesmo enquanto o spike dura.
     */
    void queryFields;
    const items = ref<GeoItem[]>([]);
    const loading = ref(false);
    const error = ref<unknown>(null);
    const totalPages = ref(1);
    const itemCount = ref(0);
    const totalCount = ref(0);

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

      /*
       * The columns the grid shows, stored in `layoutQuery.fields` — the same
       * place the Directus tabular layout keeps them. They were in
       * `layoutOptions` at first, which is not where Directus looks.
       *
       * Three sources, in order: what the user chose, the numbered
       * `coluna1..5` a preset written by an earlier version still carries, and
       * finally what was detected from the collection. Only the first is ever
       * written back.
       */
      const fields = computed<string[]>({
        get() {
          const chosen = writableQuery.fields.value;
          if (chosen && chosen.length > 0) return chosen;

          const legacy = normalizeLayoutOptions(layoutOptions.value).fields;
          if (legacy && legacy.length > 0) return legacy;

          return detectedStringFields.value.slice(0, DEFAULT_COLUMN_COUNT);
        },
        set(newValue) {
          writableQuery.fields.value = newValue;
        },
      });

      return {
        fields,
        title,
        zoomOnClick,
        geolocation,
        mapCenterLng,
        mapCenterLat,
        mapZoom,
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
      // page, limit and sort are two-way: the grid writes the sort when a header
      // is clicked, and playback writes the page when it runs off the end of one
      const { page, limit, sort } = writableQuery;

      /*
       * Only what is actually needed. This used to request every field of the
       * collection to show a handful, so each page carried columns nobody was
       * looking at.
       */
      const fields = computed(() =>
        fieldsToFetch({
          displayed: layoutOptionBindings.fields.value ?? [],
          primaryKey: primaryKeyField.value?.field ?? 'id',
          geolocation: layoutOptionBindings.geolocation.value,
          titleTemplate: layoutOptionBindings.title.value,
        })
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
      sort,
      fieldsInCollection,
      selectedItems,
      deleteSelectedItems,
      ...layoutOptionBindings,
    };
  },
});
