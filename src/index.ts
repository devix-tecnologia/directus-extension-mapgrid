import {
  defineLayout,
  useApi,
  useCollection,
  useExtensions,
  useSync,
} from '@directus/extensions-sdk';
import type { Field, LayoutProps } from '@directus/types';
import { computed, reactive, ref, toRefs } from 'vue';
import DeleteAction from './components/atoms/delete-action/DeleteAction.vue';
import Layout from './components/templates/mapgrid-layout/MapgridLayout.vue';
import Options from './components/templates/mapgrid-options/MapgridOptions.vue';
import type { CameraTracking, GeoItem } from './contract/index';
import { useWritableLayoutQuery } from './contract/index';
import { CameraTrackingPolicy } from './services/camera-tracking/index';
import {
  EMBEDDED_LAYOUTS,
  type EmbeddedLayout,
  embedLayout,
} from './services/embedded-layout/index';
import { useOptimisticWrite } from './services/optimistic-sync/index';
import type { LayoutOptions, LayoutQuery } from './types';

/**
 * Directus control fields. None of them works as a geometry, and picking one as
 * the default would only mean swapping it out in every new collection.
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

const detectGeometry = (fields: Field[]): string | undefined => {
  const mapField = fields.find((field) => field.meta?.interface === 'map');
  if (mapField) return mapField.field;

  const jsonField = fields.find(
    (field) => field.type === 'json' && !EXCLUDED_FIELDS.includes(field.field)
  );
  return jsonField?.field;
};

type EmbeddedOptions = { value: Record<string, unknown> };

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
    /*
     * The three shared states go through the `useOptimisticWrite` mirror.
     * Without it, two writes in the same tick would both read the prop as it
     * was before either — and writing in the same tick is routine here, because
     * both embedded layouts write to the same three. The why is over there.
     */
    const layoutOptions = useOptimisticWrite(useSync(props, 'layoutOptions', emit));
    const layoutQuery = useOptimisticWrite(useSync(props, 'layoutQuery', emit));
    const selection = useOptimisticWrite(useSync(props, 'selection', emit));
    const api = useApi();

    const { collection, filter, search } = toRefs(props);
    const { fields: fieldsInCollection, primaryKeyField } = useCollection(collection);
    const { layouts } = useExtensions();

    const writableQuery = useWritableLayoutQuery(layoutQuery);
    const detectedGeometry = computed(() => detectGeometry(fieldsInCollection.value ?? []));

    /*
     * Each embedded layout keeps its configuration under its own key of our
     * `layoutOptions`: the map the geometry field and the basemap, the grid the
     * spacing and the alignment. Under a single key, one would overwrite the
     * other.
     */
    const gridOptions = computed<Record<string, unknown>>({
      get: () => ({ ...((layoutOptions.value?.tabular ?? {}) as object) }),
      set: (value) => {
        layoutOptions.value = { ...layoutOptions.value, tabular: value };
      },
    });

    /*
     * The detected geometry field only enters on the read side. Writing it
     * would pin a choice the composition merely detected into the preset, and
     * changing the collection's field would stop having any effect.
     */
    const mapOptions = computed<Record<string, unknown>>({
      get: () => ({
        geometryField: detectedGeometry.value,
        ...((layoutOptions.value?.map ?? {}) as object),
      }),
      set: (value) => {
        layoutOptions.value = { ...layoutOptions.value, map: value };
      },
    });

    /*
     * The query is a single one, shared by both. Without this each layout runs
     * its own fetch, with different fields and sorting — measured in the spike.
     */
    const query = computed<Record<string, unknown>>({
      get: () => ({ ...(layoutQuery.value ?? {}) }),
      set: (value) => {
        layoutQuery.value = value as unknown as LayoutQuery;
      },
    });

    const propsFor = (options: EmbeddedOptions): LayoutProps =>
      reactive({
        collection,
        selection,
        layoutOptions: options,
        layoutQuery: query,
        layoutProps: ref({}),
        filter,
        filterUser: ref(null),
        filterSystem: ref(null),
        search,
        showSelect: ref('multiple'),
        selectMode: ref(false),
        readonly: ref(false),
        resetPreset: ref(undefined),
        clearFilters: ref(undefined),
      }) as unknown as LayoutProps;

    const emitFor =
      (options: EmbeddedOptions) =>
      (event: string, value: unknown): void => {
        if (event === 'update:layoutQuery') query.value = value as Record<string, unknown>;
        if (event === 'update:layoutOptions') options.value = value as Record<string, unknown>;
        if (event === 'update:selection') selection.value = value as (string | number)[];
      };

    const embed = (id: string, options: EmbeddedOptions): EmbeddedLayout | null =>
      embedLayout({
        id,
        registry: layouts.value,
        props: propsFor(options),
        emit: emitFor(options),
      });

    const grid = embed(EMBEDDED_LAYOUTS.grid, gridOptions);
    const map = embed(EMBEDDED_LAYOUTS.map, mapOptions);

    /** The only options that come from neither of them: they are the composition's. */
    const zoomOnClick = computed<boolean | undefined>({
      get: () => layoutOptions.value?.zoomOnClick,
      set: (value) => {
        layoutOptions.value = { ...layoutOptions.value, zoomOnClick: value };
      },
    });

    const playbackInterval = computed<number | undefined>({
      get: () => layoutOptions.value?.playbackInterval,
      set: (value) => {
        layoutOptions.value = { ...layoutOptions.value, playbackInterval: value };
      },
    });

    const trackingPolicy = new CameraTrackingPolicy();
    const cameraTracking = computed(() => trackingPolicy.from(layoutOptions.value?.cameraTracking));
    const setCameraTracking = (value: CameraTracking): void => {
      layoutOptions.value = { ...layoutOptions.value, cameraTracking: value };
    };

    // the same path the tabular's footer takes
    const goToPage = (page: number): void => {
      writableQuery.page.value = page;
    };

    // `page` stays out: turning the page walks the same sequence
    const queryKey = computed(() =>
      JSON.stringify([
        props.filter,
        props.search,
        writableQuery.sort.value,
        writableQuery.limit.value,
      ])
    );

    const fetchItems = async (
      keys: readonly unknown[],
      fields: readonly string[]
    ): Promise<Record<string, unknown>[]> => {
      const key = primaryKeyField.value?.field;
      if (!key || keys.length === 0) return [];
      const response = await api.get(`/items/${collection.value}`, {
        params: {
          fields: [...fields],
          filter: { [key]: { _in: [...keys] } },
          limit: keys.length,
        },
      });
      return (response.data?.data as Record<string, unknown>[] | undefined) ?? [];
    };

    /** The app reads these from here to draw pagination and the count. */
    const fromGrid = <T>(key: string, empty: T) =>
      computed<T>(() => (grid?.state[key] as T) ?? empty);

    const items = fromGrid<GeoItem[]>('items', []);

    const selectedItems = computed<GeoItem[]>(() =>
      items.value.filter((item) => selection.value.includes(item.id))
    );

    const deleteSelectedItems = async (): Promise<void> => {
      if (selection.value.length === 0) return;

      await api.delete(`/items/${collection.value}`, { data: [...selection.value] });
      selection.value = [];
      (grid?.state.refresh as (() => void) | undefined)?.();
      (map?.state.refresh as (() => void) | undefined)?.();
    };

    return {
      items,
      loading: fromGrid('loading', false),
      error: fromGrid<unknown>('error', null),
      totalPages: fromGrid('totalPages', 1),
      itemCount: fromGrid('itemCount', 0),
      totalCount: fromGrid('totalCount', 0),
      page: writableQuery.page,
      limit: writableQuery.limit,
      sort: writableQuery.sort,
      fieldsInCollection,
      primaryKeyField,
      selectedItems,
      deleteSelectedItems,
      zoomOnClick,
      playbackInterval,
      cameraTracking,
      setCameraTracking,
      goToPage,
      queryKey,
      /*
       * Directus hands the return of this `setup()` to the component AND to the
       * options panel, which are siblings in the tree. That is why both
       * embedded layouts are born here: the area that draws and the panel that
       * configures come to see the same state, with no second wrapper and no
       * extra fetch.
       */
      grid,
      map,
      fetchItems,
    };
  },
});
