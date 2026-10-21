// @vitest-environment happy-dom
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  reactive,
  ref,
  useAttrs,
} from 'vue';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { EmbeddedLayout } from '../../../services/embedded-layout/index';
import { CURRENT_ROW_CLASS } from '../../../services/row-highlighter/index';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
import MapgridLayout from './MapgridLayout.vue';

/**
 * A fake embedded layout: its component draws nothing, it only keeps the
 * attributes it received. Those attributes are how the composition talks to the
 * Directus layouts — `onRowClick` and `handleClick` arrive that way — so they
 * are what a template test needs to see.
 */
function fakeEmbedded(
  id: string,
  state: Record<string, unknown>,
  /** When given, the fake draws `tbody tr` rows — where the current-record mark lands. */
  rows?: { id: string | number }[] | (() => { id: string | number }[])
) {
  const received: { attrs: Record<string, unknown> } = { attrs: {} };

  const component = defineComponent({
    name: `embedded-${id}`,
    inheritAttrs: false,
    setup() {
      received.attrs = useAttrs();
      return () =>
        h('div', { class: `embedded-${id}` }, [
          h('table', [
            h(
              'tbody',
              (typeof rows === 'function' ? rows() : (rows ?? [])).map((row) =>
                h('tr', { 'data-id': String(row.id), key: row.id }, [h('td', String(row.id))])
              )
            ),
          ]),
        ]);
    },
  });

  const embedded: EmbeddedLayout = { id, state, component, optionsComponent: null };
  return { embedded, received };
}

const BRASILIA: [number, number] = [-47.9292, -15.7801];

const markedRowIds = (wrapper: VueWrapper): string[] =>
  wrapper
    .findAll(`.${CURRENT_ROW_CLASS}`)
    .map((row) => row.attributes('data-id') ?? '')
    .filter((id) => id !== '');

interface Composition {
  mapAttrs: Record<string, unknown>;
  gridAttrs: Record<string, unknown>;
  updateSelection: ReturnType<typeof vi.fn>;
  theirHandleClick: ReturnType<typeof vi.fn>;
  /** The `data-id` of the rows carrying the current-record mark. */
  currentRowIds: () => string[];
}

function mountComposition(items: { id: string | number }[] = [{ id: 1 }, { id: 3 }]): Composition {
  const updateSelection = vi.fn();
  const theirHandleClick = vi.fn();

  const map = fakeEmbedded('map', {
    geometryField: 'location',
    selection: [],
    'onUpdate:selection': updateSelection,
    handleClick: theirHandleClick,
    cameraOptions: { center: [0, 0], zoom: 3 },
    'onUpdate:cameraOptions': vi.fn(),
  });

  const grid = fakeEmbedded('tabular', { items, onRowClick: vi.fn() }, items);

  const wrapper = mount(MapgridLayout, {
    props: { grid: grid.embedded, map: map.embedded },
    global: { components: directusComponentStubs },
  });

  return {
    mapAttrs: map.received.attrs,
    gridAttrs: grid.received.attrs,
    updateSelection,
    theirHandleClick,
    currentRowIds: () => markedRowIds(wrapper),
  };
}

const clickMarker = (composition: Composition, payload: unknown): void => {
  const handleClick = composition.mapAttrs.handleClick as (payload: unknown) => void;
  handleClick(payload);
};

describe('MapgridLayout — the marker click', () => {
  it('makes the item the current record instead of navigating to the item screen', async () => {
    const composition = mountComposition();

    clickMarker(composition, { id: 3, replace: false });
    await nextTick();

    expect(composition.currentRowIds()).toEqual(['3']);
    expect(composition.theirHandleClick).not.toHaveBeenCalled();
  });

  it('does not arm the bulk actions, which is what the selection would do', () => {
    const composition = mountComposition();

    clickMarker(composition, { id: 3 });

    expect(composition.updateSelection).not.toHaveBeenCalled();
  });

  it('moves the mark instead of accumulating records, unlike the checkbox', async () => {
    const composition = mountComposition();

    clickMarker(composition, { id: 1 });
    clickMarker(composition, { id: 3 });
    await nextTick();

    expect(composition.currentRowIds()).toEqual(['3']);
  });

  it('ignores a click that brings no item, like one on the open sea', async () => {
    const composition = mountComposition();

    clickMarker(composition, { id: 1 });
    await nextTick();
    clickMarker(composition, { id: undefined });
    clickMarker(composition, null);
    await nextTick();

    expect(composition.currentRowIds()).toEqual(['1']);
  });

  it('the row click takes the map to the item through the Directus fitBounds, not cameraOptions', () => {
    const composition = mountComposition();
    const updateCamera = vi.fn();
    const geojson = {
      bbox: [-74, -34, -34, 5],
      features: [
        {
          geometry: { coordinates: BRASILIA, type: 'Point' },
          properties: { id: 1 },
          type: 'Feature',
        },
      ],
      type: 'FeatureCollection',
    };
    const map = fakeEmbedded('map', {
      featureId: 'id',
      geometryField: 'location',
      geojson,
      geojsonBounds: undefined,
      selection: [],
      'onUpdate:selection': vi.fn(),
      cameraOptions: { center: [0, 0], zoom: 3 },
      'onUpdate:cameraOptions': updateCamera,
    });
    const grid = fakeEmbedded('tabular', { items: [] });

    mount(MapgridLayout, {
      props: { grid: grid.embedded, map: map.embedded },
      global: { components: directusComponentStubs },
    });

    const onRowClick = grid.received.attrs.onRowClick as (payload: unknown) => void;
    onRowClick({ item: { id: 1, location: { type: 'Point', coordinates: BRASILIA } } });

    const [west, south, east, north] = geojson.bbox as [number, number, number, number];
    expect(west).toBeLessThanOrEqual(BRASILIA[0]);
    expect(east).toBeGreaterThanOrEqual(BRASILIA[0]);
    expect(south).toBeLessThanOrEqual(BRASILIA[1]);
    expect(north).toBeGreaterThanOrEqual(BRASILIA[1]);
    expect(map.embedded.state.geojsonBounds).toEqual(geojson.bbox);
    expect(updateCamera).not.toHaveBeenCalled();
    expect(composition.gridAttrs.onRowClick).toBeTypeOf('function');
  });

  it('while the map loads, it retries the bounds until the Directus moveend writes the camera', async () => {
    vi.useFakeTimers();
    try {
      mountComposition();
      const collectionBbox = [-74, -34, -34, 5];
      const geojson = {
        bbox: [...collectionBbox],
        features: [
          {
            geometry: { coordinates: BRASILIA, type: 'Point' },
            properties: { id: 1 },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      };
      const state = reactive<Record<string, unknown>>({
        cameraOptions: { center: [0, 0], zoom: 3 },
        geojson,
        geojsonBounds: undefined,
        featureId: 'id',
        geometryField: 'location',
        selection: [],
      });
      const map = fakeEmbedded('map', state);
      const grid = fakeEmbedded('tabular', { items: [] });
      mount(MapgridLayout, {
        props: { grid: grid.embedded, map: map.embedded },
        global: { components: directusComponentStubs },
      });

      const onRowClick = grid.received.attrs.onRowClick as (payload: unknown) => void;
      onRowClick({ item: { id: 1, location: { type: 'Point', coordinates: BRASILIA } } });
      const first = state.geojsonBounds;
      await vi.advanceTimersByTimeAsync(300);
      expect(state.geojsonBounds).not.toBe(first);

      state.cameraOptions = { bbox: [-49, -17, -46, -14], center: BRASILIA, zoom: 8 };
      await nextTick();
      const last = state.geojsonBounds;
      await vi.advanceTimersByTimeAsync(1_000);
      expect(state.geojsonBounds).toBe(last);
      expect(state.geojson).toMatchObject({ bbox: collectionBbox });
    } finally {
      vi.useRealTimers();
    }
  });

  it('the toolbar reset frames the collection, even with a row click still pending', async () => {
    vi.useFakeTimers();
    try {
      mountComposition();
      const collectionBbox = [-74, -34, -34, 5];
      let bboxReadByDirectus: unknown;
      const state = reactive<Record<string, unknown>>({
        cameraOptions: { center: [0, 0], zoom: 3 },
        fitDataBounds: vi.fn(() => {
          bboxReadByDirectus = [...(state.geojson as { bbox: number[] }).bbox];
        }),
        geojson: {
          bbox: [...collectionBbox],
          features: [
            {
              geometry: { coordinates: BRASILIA, type: 'Point' },
              properties: { id: 1 },
              type: 'Feature',
            },
          ],
          type: 'FeatureCollection',
        },
        geojsonBounds: undefined,
        geometryField: 'location',
        selection: [],
      });
      const map = fakeEmbedded('map', state);
      const grid = fakeEmbedded('tabular', { items: [] });
      const wrapper = mount(MapgridLayout, {
        props: { grid: grid.embedded, map: map.embedded },
        global: { components: directusComponentStubs },
      });

      const onRowClick = grid.received.attrs.onRowClick as (payload: unknown) => void;
      onRowClick({ item: { id: 1, location: { type: 'Point', coordinates: BRASILIA } } });
      wrapper.findComponent(MapToolbar).vm.$emit('reset');

      expect(state.fitDataBounds).toHaveBeenCalledOnce();
      expect(bboxReadByDirectus).toEqual(collectionBbox);
    } finally {
      vi.useRealTimers();
    }
  });

  it('the row click frames by the Directus feature, even with the field in csv', () => {
    mountComposition();
    const route = {
      coordinates: [
        [-40.1, -20.1],
        [-39.7, -19.8],
      ],
      type: 'LineString',
    };
    const geojson = {
      bbox: [-74, -34, -34, 5],
      features: [{ geometry: route, properties: { id: 3 }, type: 'Feature' }],
      type: 'FeatureCollection',
    };
    const map = fakeEmbedded('map', {
      cameraOptions: { center: [0, 0], zoom: 3 },
      featureId: 'id',
      geojson,
      geojsonBounds: undefined,
      geometryField: 'place',
      selection: [],
    });
    const grid = fakeEmbedded('tabular', { items: [] });
    mount(MapgridLayout, {
      props: { grid: grid.embedded, map: map.embedded },
      global: { components: directusComponentStubs },
    });

    const onRowClick = grid.received.attrs.onRowClick as (payload: unknown) => void;
    onRowClick({ item: { id: 3, place: '-40.1,-20.1' } });

    expect(geojson.bbox).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });
});

/**
 * The Directus map layout's `showingCount` calls `useI18n()` from inside a
 * `computed` getter. Outside a render there is no current instance, and
 * vue-i18n throws a `SyntaxError` — the error the e2e logged in the console on
 * every fetch filtered by the visible area.
 *
 * And the getter is evaluated outside the render: before repainting, the Vue
 * scheduler asks the effect whether it is dirty, and that question re-evaluates
 * the `computed`s it depends on with no current instance at all. If the throw
 * crosses our state read, it takes the whole question down — the composition
 * stops repainting, and fresh `geojsonBounds` never reaches the map.
 */
describe('an embedded state getter that throws outside the render', () => {
  it('does not block the next delivery to the map', async () => {
    const receivedBounds: unknown[] = [];
    const mapLayout = defineComponent({
      inheritAttrs: false,
      props: { geojsonBounds: { default: undefined, type: null } },
      setup(props) {
        return () => {
          receivedBounds.push(props.geojsonBounds);
          return h('div');
        };
      },
    });
    const onScreen = ref(2);
    /*
     * Armed only after mounting because @vue/test-utils' `mount` scans the
     * props looking for refs and would read the getter outside the render
     * itself — the throw would come from the harness, not from what is being
     * measured.
     */
    let armed = false;
    const state = reactive<Record<string, unknown>>({
      geojsonBounds: ref<unknown>(undefined),
      showingCount: computed(() => {
        if (armed && getCurrentInstance() === null) {
          throw new SyntaxError('Must be called at the top of a `setup` function');
        }
        return `1-${onScreen.value} of ${onScreen.value}`;
      }),
    });
    const map: EmbeddedLayout = {
      component: mapLayout,
      id: 'map',
      optionsComponent: null,
      state,
    };
    const grid = fakeEmbedded('tabular', { items: [] });
    mount(MapgridLayout, {
      props: { grid: grid.embedded, map },
      global: { components: directusComponentStubs },
    });

    armed = true;

    // the fetch filtered by the visible area changes the count, and only it
    onScreen.value = 1;
    await nextTick();

    // the fetched geometry arrives later, as in a click on an off-screen row
    state.geojsonBounds = [-60.0255, -3.119, -48.5044, -1.4558];
    await nextTick();

    expect(receivedBounds[receivedBounds.length - 1]).toEqual([
      -60.0255, -3.119, -48.5044, -1.4558,
    ]);
  });
});

// the camera starts ready: the centerer stops re-delivering only after the first `moveend`
function mountWalk(
  options: {
    ids?: (string | number)[];
    page?: number;
    totalPages?: number;
    cameraTracking?: 'off' | 'follow' | 'center';
    playbackInterval?: number;
    /** More fields on each grid item, by id. */
    itemFields?: (id: string | number) => Record<string, unknown>;
    /** Any other prop the layout takes. */
    props?: Record<string, unknown>;
  } = {}
) {
  const ids = options.ids ?? [1, 2, 3];
  const goToPage = vi.fn();
  const setCameraTracking = vi.fn();

  const gridState = reactive<Record<string, unknown>>({
    items: ids.map((id) => ({
      id,
      location: { coordinates: [Number(id) * 10, 0], type: 'Point' },
      ...options.itemFields?.(id),
    })),
    loading: false,
    totalPages: options.totalPages ?? 1,
  });

  const mapState = reactive<Record<string, unknown>>({
    cameraOptions: { bbox: [-10, -10, 10, 10], center: [0, 0], zoom: 3 },
    featureId: 'id',
    geojson: { bbox: [-10, -10, 10, 10], features: [], type: 'FeatureCollection' },
    geojsonBounds: undefined,
    geometryField: 'location',
    isGeometryFieldNative: true,
    selection: [],
  });

  const grid = fakeEmbedded(
    'tabular',
    gridState,
    () => gridState.items as { id: string | number }[]
  );
  const map = fakeEmbedded('map', mapState);

  const wrapper = mount(MapgridLayout, {
    props: {
      grid: grid.embedded,
      map: map.embedded,
      page: options.page ?? 1,
      goToPage,
      cameraTracking: options.cameraTracking,
      setCameraTracking,
      playbackInterval: options.playbackInterval,
      queryKey: 'first-query',
      ...options.props,
    },
    global: { components: directusComponentStubs },
  });

  const toolbar = wrapper.findComponent(MapToolbar);

  return {
    wrapper,
    gridState,
    mapState,
    goToPage,
    setCameraTracking,
    toolbar,
    current: () => markedRowIds(wrapper),
    click: async (id: string | number): Promise<void> => {
      const onRowClick = grid.received.attrs.onRowClick as (payload: unknown) => void;
      onRowClick({ item: (gridState.items as { id: string | number }[]).find((i) => i.id === id) });
      await nextTick();
    },
    press: async (control: string): Promise<void> => {
      toolbar.vm.$emit(control);
      await nextTick();
      await nextTick();
    },
    ready: async (): Promise<void> => {
      mapState.cameraOptions = { bbox: [-10, -10, 10, 10], center: [0, 0], zoom: 3 };
      await nextTick();
      mapState.geojsonBounds = undefined;
    },
  };
}

describe('MapgridLayout — walking the records', () => {
  it('starts at the first record when nothing is current yet', async () => {
    const walk = mountWalk();

    await walk.press('next');

    expect(walk.current()).toEqual(['1']);
  });

  it('advances and goes back one record', async () => {
    const walk = mountWalk();

    await walk.press('next');
    await walk.press('next');
    expect(walk.current()).toEqual(['2']);

    await walk.press('previous');
    expect(walk.current()).toEqual(['1']);
  });

  it('goes to the ends of the query', async () => {
    const walk = mountWalk();

    await walk.press('last');
    expect(walk.current()).toEqual(['3']);

    await walk.press('first');
    expect(walk.current()).toEqual(['1']);
  });

  it('stands still at the ends, and says so to the toolbar', async () => {
    const walk = mountWalk();

    await walk.press('first');
    expect(walk.toolbar.props('atStart')).toBe(true);
    await walk.press('previous');
    expect(walk.current()).toEqual(['1']);

    await walk.press('last');
    expect(walk.toolbar.props('atEnd')).toBe(true);
    await walk.press('next');
    expect(walk.current()).toEqual(['3']);
  });

  it('takes the map to the record it walked to', async () => {
    const walk = mountWalk();
    await walk.ready();

    await walk.press('last');

    expect(walk.mapState.geojsonBounds).toBeDefined();
  });
});

describe('MapgridLayout — turning the page', () => {
  it('asks the layout for the next page and lands on its first record', async () => {
    const walk = mountWalk({ page: 1, totalPages: 2 });

    await walk.click(3);
    await walk.press('next');

    expect(walk.goToPage).toHaveBeenCalledWith(2);
    // the mark stays where it is until the page arrives, instead of blinking off
    expect(walk.current()).toEqual(['3']);

    walk.gridState.items = [{ id: 4 }, { id: 5 }];
    await walk.wrapper.setProps({ page: 2 });
    await nextTick();

    expect(walk.current()).toEqual(['4']);
  });

  it('recoils to the last record of the previous page, not to its first', async () => {
    const walk = mountWalk({ ids: [4, 5], page: 2, totalPages: 2 });

    await walk.click(4);
    await walk.press('previous');

    expect(walk.goToPage).toHaveBeenCalledWith(1);

    walk.gridState.items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    await walk.wrapper.setProps({ page: 1 });
    await nextTick();

    expect(walk.current()).toEqual(['3']);
  });

  it('takes first and last to the ends of the query, not of the page', async () => {
    const walk = mountWalk({ ids: [4, 5], page: 2, totalPages: 3 });

    await walk.press('first');
    expect(walk.goToPage).toHaveBeenCalledWith(1);

    await walk.press('last');
    expect(walk.goToPage).toHaveBeenCalledWith(3);
  });

  it('waits for the page instead of stepping over the list that is still the old one', async () => {
    const walk = mountWalk();

    await walk.press('next');
    walk.gridState.loading = true;
    await nextTick();

    await walk.press('next');

    expect(walk.current()).toEqual(['1']);
    expect(walk.toolbar.props('loading')).toBe(true);
  });
});

describe('MapgridLayout — playback', () => {
  it('walks on its own and stops where it was told to', async () => {
    vi.useFakeTimers();
    try {
      const walk = mountWalk({ ids: [1, 2, 3, 4], playbackInterval: 1 });

      await walk.press('play');
      expect(walk.toolbar.props('playing')).toBe(true);

      await vi.advanceTimersByTimeAsync(1_000);
      await nextTick();
      expect(walk.current()).toEqual(['1']);

      await vi.advanceTimersByTimeAsync(1_000);
      await nextTick();
      expect(walk.current()).toEqual(['2']);

      await walk.press('stop');
      await vi.advanceTimersByTimeAsync(5_000);
      await nextTick();

      expect(walk.current()).toEqual(['2']);
      expect(walk.toolbar.props('playing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops by itself at the last record of the last page', async () => {
    vi.useFakeTimers();
    try {
      const walk = mountWalk({ ids: [1, 2], playbackInterval: 1 });

      await walk.press('play');
      await vi.advanceTimersByTimeAsync(10_000);
      await nextTick();

      expect(walk.current()).toEqual(['2']);
      expect(walk.toolbar.props('playing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

// `mountWalk`'s grid never reports loading: only the turn in flight may stop a second request
describe('MapgridLayout — anticipating the page turn', () => {
  /** The page the layout asked for, arriving. */
  const arrive = async (
    walk: ReturnType<typeof mountWalk>,
    ids: (string | number)[],
    page: number
  ): Promise<void> => {
    walk.gridState.items = ids.map((id) => ({
      id,
      location: { coordinates: [Number(id) * 10, 0], type: 'Point' },
    }));
    await walk.wrapper.setProps({ page });
    await nextTick();
  };

  const onTheLastRecordOfPageOne = async (totalPages = 2) => {
    const walk = mountWalk({ ids: [1, 2, 3], page: 1, playbackInterval: 1, totalPages });
    await walk.click(3);
    await walk.press('play');
    return walk;
  };

  it('asks for the next page before the beat, by what a fetch is expected to take', async () => {
    vi.useFakeTimers();
    try {
      const walk = await onTheLastRecordOfPageOne();

      // the default guess is 250ms of fetch, so the turn is fired 750ms into the step
      await vi.advanceTimersByTimeAsync(700);
      expect(walk.goToPage).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);
      expect(walk.goToPage).toHaveBeenCalledWith(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not anticipate the page after the last one', async () => {
    vi.useFakeTimers();
    try {
      const walk = await onTheLastRecordOfPageOne(1);

      await vi.advanceTimersByTimeAsync(5_000);

      expect(walk.goToPage).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops the turn it had armed when the playback stops', async () => {
    vi.useFakeTimers();
    try {
      const walk = await onTheLastRecordOfPageOne();

      await walk.press('stop');
      await vi.advanceTimersByTimeAsync(5_000);

      expect(walk.goToPage).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('asks for the page once, and not again at every beat while it is on its way', async () => {
    vi.useFakeTimers();
    try {
      const walk = await onTheLastRecordOfPageOne();

      await vi.advanceTimersByTimeAsync(4_000);

      expect(walk.goToPage).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives the record the page brought a whole step, counted from where the page landed', async () => {
    vi.useFakeTimers();
    try {
      const walk = await onTheLastRecordOfPageOne(3);

      // the fetch took 650ms, and not the 250ms guessed: the page lands late
      await vi.advanceTimersByTimeAsync(1_400);
      expect(walk.current()).toEqual(['3']);

      await arrive(walk, [4, 5, 6], 2);
      expect(walk.current()).toEqual(['4']);

      await vi.advanceTimersByTimeAsync(999);
      expect(walk.current()).toEqual(['4']);

      await vi.advanceTimersByTimeAsync(2);
      expect(walk.current()).toEqual(['5']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sizes the next anticipation by the fetch it measured, not by the guess', async () => {
    vi.useFakeTimers();
    try {
      const walk = await onTheLastRecordOfPageOne(3);

      await vi.advanceTimersByTimeAsync(1_400);
      await arrive(walk, [4, 5, 6], 2);
      expect(walk.current()).toEqual(['4']);

      // 5 and then 6, the last record of the page: the turn is armed again there
      await vi.advanceTimersByTimeAsync(2_000);
      expect(walk.current()).toEqual(['6']);

      // 650ms measured against a 1s beat: 350ms into the step, and not 750ms
      await vi.advanceTimersByTimeAsync(300);
      expect(walk.goToPage).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(100);
      expect(walk.goToPage).toHaveBeenLastCalledWith(3);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('MapgridLayout — the camera tracking', () => {
  it('leaves the camera alone when tracking is off', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    await walk.ready();

    await walk.press('next');

    expect(walk.current()).toEqual(['1']);
    expect(walk.mapState.geojsonBounds).toBeUndefined();
  });

  it('moves on every step when the record is to be kept centred', async () => {
    const walk = mountWalk({ cameraTracking: 'center' });
    await walk.ready();

    await walk.press('next');

    expect(walk.mapState.geojsonBounds).toBeDefined();
  });

  it('stays put while the record is inside the visible area when following', async () => {
    const walk = mountWalk({ cameraTracking: 'follow' });
    await walk.ready();

    await walk.press('next');

    expect(walk.mapState.geojsonBounds).toBeUndefined();
  });

  it('hands the cycled state up, for the layout to persist', async () => {
    const walk = mountWalk({ cameraTracking: 'follow' });

    walk.toolbar.vm.$emit('update:tracking', 'center');
    await nextTick();

    expect(walk.setCameraTracking).toHaveBeenCalledWith('center');
  });
});

describe('MapgridLayout — a query that became another one', () => {
  it('drops the current record and stops the playback', async () => {
    vi.useFakeTimers();
    try {
      const walk = mountWalk({ playbackInterval: 1 });

      await walk.press('play');
      await vi.advanceTimersByTimeAsync(1_000);
      await nextTick();
      expect(walk.current()).toEqual(['1']);

      await walk.wrapper.setProps({ queryKey: 'filtered-by-city' });
      await nextTick();

      expect(walk.current()).toEqual([]);
      expect(walk.toolbar.props('playing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

/** Gives the map pane a size, which happy-dom leaves at zero and the projection needs. */
const givePaneSize = (wrapper: VueWrapper, width = 800, height = 400): void => {
  const pane = wrapper.find('.mapgrid-pane--map').element as HTMLElement;
  Object.defineProperty(pane, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(pane, 'clientHeight', { configurable: true, value: height });
};

/** Where the mark of the current record sits in the pane, in pixels. */
const currentPointAt = (wrapper: VueWrapper): { x: number; y: number } | null => {
  const mark = wrapper.find('[data-current-point]');
  if (!mark.exists()) return null;
  const style = (mark.element as HTMLElement).style;
  return { x: Number.parseFloat(style.left), y: Number.parseFloat(style.top) };
};

describe('MapgridLayout — the current record on the map', () => {
  it('draws the record as a point of its own, which the cluster would have swallowed', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    walk.mapState.clusterData = true;
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');

    // camera at [0, 0] and zoom 3: 512px of world per tile, so a degree is 4096/360 px
    expect(currentPointAt(walk.wrapper)?.x).toBeCloseTo(400 + (4096 * 10) / 360, 6);
    expect(walk.mapState.clusterData).toBe(true);
  });

  it('follows every step, instead of standing on the record it started at', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    walk.mapState.clusterData = true;
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    const first = currentPointAt(walk.wrapper);
    await walk.press('next');

    expect(currentPointAt(walk.wrapper)?.x).toBeCloseTo((first?.x ?? 0) + (4096 * 10) / 360, 6);
  });

  it('waits for the camera to land before drawing, or it would mark the place it left', async () => {
    const walk = mountWalk({ cameraTracking: 'center' });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    expect(currentPointAt(walk.wrapper)).toBeNull();

    // the Directus map only publishes the camera on `moveend`
    walk.mapState.cameraOptions = { bbox: [0, -10, 20, 10], center: [10, 0], zoom: 3 };
    await nextTick();
    await nextTick();

    expect(currentPointAt(walk.wrapper)?.x).toBeCloseTo(400, 6);
  });

  it('takes the mark off the map when the query became another one', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    expect(currentPointAt(walk.wrapper)).not.toBeNull();

    await walk.wrapper.setProps({ queryKey: 'filtered-by-city' });
    await nextTick();

    expect(currentPointAt(walk.wrapper)).toBeNull();
  });
});

/** A key pressed on the page, as the browser delivers it: bubbling up to the document. */
const press = async (key: string, target: Element = document.body): Promise<KeyboardEvent> => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  await nextTick();
  await nextTick();
  return event;
};

describe('MapgridLayout — the keyboard', () => {
  it('walks the records with the arrows and the ends with Home and End', async () => {
    const walk = mountWalk();

    await press('ArrowRight');
    expect(walk.current()).toEqual(['1']);

    await press('ArrowRight');
    expect(walk.current()).toEqual(['2']);

    await press('ArrowLeft');
    expect(walk.current()).toEqual(['1']);

    await press('End');
    expect(walk.current()).toEqual(['3']);

    await press('Home');
    expect(walk.current()).toEqual(['1']);
  });

  it('keeps the key from scrolling the page, which is what it would do by default', async () => {
    mountWalk();

    expect((await press('End')).defaultPrevented).toBe(true);
    expect((await press('ArrowUp')).defaultPrevented).toBe(false);
  });

  it('starts and stops the playback with Space', async () => {
    vi.useFakeTimers();
    try {
      const walk = mountWalk({ ids: [1, 2, 3, 4], playbackInterval: 1 });

      await press(' ');
      expect(walk.toolbar.props('playing')).toBe(true);

      await vi.advanceTimersByTimeAsync(1_000);
      await nextTick();
      expect(walk.current()).toEqual(['1']);

      await press(' ');
      expect(walk.toolbar.props('playing')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps quiet while the person types, so a space in a filter stays a space', async () => {
    const walk = mountWalk();
    const field = document.createElement('input');
    document.body.append(field);

    await press('ArrowRight', field);

    expect(walk.current()).toEqual([]);
    field.remove();
  });

  it('keeps quiet while the focus is elsewhere — a dialog, the sidebar', async () => {
    const walk = mountWalk();
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();

    await press('ArrowRight', elsewhere);

    expect(walk.current()).toEqual([]);
    elsewhere.remove();
  });
});

const headingOf = (wrapper: VueWrapper): string | undefined =>
  wrapper.find('[data-current-point]').attributes('data-heading-degrees');

describe('MapgridLayout — where the current record is heading', () => {
  it('draws no arrow on the first record, which has nothing before it', async () => {
    const walk = mountWalk({ cameraTracking: 'off', props: { headingSource: 'computed' } });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');

    expect(walk.wrapper.find('[data-heading-cone]').exists()).toBe(false);
  });

  it('points from the record visited before, east along the equator', async () => {
    const walk = mountWalk({ cameraTracking: 'off', props: { headingSource: 'computed' } });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    await walk.press('next');

    expect(headingOf(walk.wrapper)).toBe('90');
    expect(walk.wrapper.get('[data-heading-cone]').attributes('style')).toContain('rotate(90deg)');
  });

  it('reads the course field, normalising a signed one', async () => {
    const walk = mountWalk({
      cameraTracking: 'off',
      itemFields: () => ({ course: -137 }),
      props: { headingSource: 'field', headingField: 'course' },
    });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    await nextTick();

    expect(headingOf(walk.wrapper)).toBe('223');
  });

  it('shows nothing while the source is off', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    await walk.press('next');

    expect(walk.wrapper.find('[data-heading-cone]').exists()).toBe(false);
  });
});

const trailSegments = (wrapper: VueWrapper): number => {
  const trail = wrapper.find('[data-trail]');
  return trail.exists() ? Number(trail.attributes('data-trail-segments')) : 0;
};

describe('MapgridLayout — the trail', () => {
  it('joins the records visited, one leg per step', async () => {
    const walk = mountWalk({
      cameraTracking: 'off',
      ids: [1, 2, 3, 4],
      props: { trailLength: 10 },
    });
    givePaneSize(walk.wrapper);
    await walk.ready();

    for (const _ of [1, 2, 3]) await walk.press('next');

    expect(trailSegments(walk.wrapper)).toBe(2);
  });

  it('keeps the trail across a page turn, since it comes from what was visited', async () => {
    const walk = mountWalk({
      cameraTracking: 'off',
      page: 1,
      totalPages: 2,
      props: { trailLength: 10 },
    });
    givePaneSize(walk.wrapper);
    await walk.ready();

    for (const _ of [1, 2, 3]) await walk.press('next');
    await walk.press('next');
    walk.gridState.items = [4, 5].map((id) => ({
      id,
      location: { coordinates: [id * 10, 0], type: 'Point' },
    }));
    await walk.wrapper.setProps({ page: 2 });
    await nextTick();
    await nextTick();

    expect(walk.current()).toEqual(['4']);
    expect(trailSegments(walk.wrapper)).toBe(3);
  });

  it('draws only as many records as asked for, and nothing at zero', async () => {
    const walk = mountWalk({ cameraTracking: 'off', ids: [1, 2, 3, 4], props: { trailLength: 2 } });
    givePaneSize(walk.wrapper);
    await walk.ready();
    for (const _ of [1, 2, 3, 4]) await walk.press('next');
    expect(trailSegments(walk.wrapper)).toBe(1);

    await walk.wrapper.setProps({ trailLength: 0 });
    expect(trailSegments(walk.wrapper)).toBe(0);
  });

  it('starts over when the query became another one', async () => {
    const walk = mountWalk({ cameraTracking: 'off', props: { trailLength: 10 } });
    givePaneSize(walk.wrapper);
    await walk.ready();
    for (const _ of [1, 2, 3]) await walk.press('next');

    await walk.wrapper.setProps({ queryKey: 'sorted-by-name' });
    await nextTick();

    expect(trailSegments(walk.wrapper)).toBe(0);
  });
});

const MINUTE = 60_000;

describe('MapgridLayout — playback on the data clock', () => {
  it('waits the time between the records, sped up', async () => {
    vi.useFakeTimers();
    try {
      // 2 minutes and then 8 minutes apart: at 60× that is 2s and 8s
      const at: Record<string, number> = { 1: 0, 2: 2 * MINUTE, 3: 10 * MINUTE };
      const walk = mountWalk({
        cameraTracking: 'off',
        itemFields: (id) => ({ at: new Date(at[String(id)] ?? 0).toISOString() }),
        props: { playbackTiming: 'realtime', playbackSpeed: 60, playbackTimeField: 'at' },
      });
      await walk.ready();

      await walk.press('play');
      await vi.advanceTimersByTimeAsync(200);
      expect(walk.current()).toEqual(['1']);

      await vi.advanceTimersByTimeAsync(1_999);
      expect(walk.current()).toEqual(['1']);
      await vi.advanceTimersByTimeAsync(1);
      expect(walk.current()).toEqual(['2']);

      await vi.advanceTimersByTimeAsync(7_999);
      expect(walk.current()).toEqual(['2']);
      await vi.advanceTimersByTimeAsync(1);
      expect(walk.current()).toEqual(['3']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the fixed beat when the timing is fixed', async () => {
    vi.useFakeTimers();
    try {
      const walk = mountWalk({
        playbackInterval: 1,
        itemFields: (id) => ({ at: new Date(Number(id) * 60 * MINUTE).toISOString() }),
        props: { playbackTimeField: 'at' },
      });
      await walk.ready();

      await walk.press('play');
      await vi.advanceTimersByTimeAsync(2_000);

      expect(walk.current()).toEqual(['2']);
    } finally {
      vi.useRealTimers();
    }
  });
});

const flush = async (): Promise<void> => {
  for (const _ of [1, 2, 3, 4]) await nextTick();
};

describe('MapgridLayout — the timeline', () => {
  const at = (id: string | number): Record<string, unknown> => ({
    at: new Date(Number(id) * MINUTE * 10).toISOString(),
  });

  type Locate = (field: string, instant: number) => Promise<{ id: number; page: number } | null>;

  const timelineWalk = (locateInstant: Locate = vi.fn(async () => null)) =>
    mountWalk({
      cameraTracking: 'off',
      ids: [1, 2, 3],
      itemFields: at,
      props: {
        playbackTimeField: 'at',
        fetchTimeRange: async () => ({
          first: new Date(10 * MINUTE).toISOString(),
          last: new Date(30 * MINUTE).toISOString(),
        }),
        locateInstant,
      },
    });

  it('shows the trip with a tick per loaded record and the current one marked', async () => {
    const walk = timelineWalk();
    await flush();

    expect(walk.wrapper.findAll('[data-timeline-tick]')).toHaveLength(3);
    expect(walk.wrapper.find('[data-timeline-marker]').exists()).toBe(false);

    await walk.press('next');
    await walk.press('next');
    await flush();

    expect(walk.wrapper.get('[data-timeline-marker]').attributes('data-position')).toBe('50.00');
  });

  it('is not there without a time field', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    await flush();

    expect(walk.wrapper.find('[data-timeline]').exists()).toBe(false);
  });

  it('jumps to the record the server places at the moment chosen', async () => {
    const locate = vi.fn<Locate>(async () => ({ id: 3, page: 1 }));
    const walk = timelineWalk(locate);
    await flush();

    walk.wrapper.findComponent({ name: 'TripTimelineBar' }).vm.$emit('seek', 100);
    await flush();

    expect(locate).toHaveBeenCalledWith('at', 30 * MINUTE);
    expect(walk.current()).toEqual(['3']);
  });

  it('turns the page when the moment is on another one, and lands on that record', async () => {
    const locate = vi.fn<Locate>(async () => ({ id: 5, page: 2 }));
    const walk = timelineWalk(locate);
    await flush();

    walk.wrapper.findComponent({ name: 'TripTimelineBar' }).vm.$emit('seek', 90);
    await flush();
    expect(walk.goToPage).toHaveBeenCalledWith(2);

    walk.gridState.items = [4, 5, 6].map((id) => ({ id, ...at(id) }));
    await walk.wrapper.setProps({ page: 2 });
    await flush();

    expect(walk.current()).toEqual(['5']);
  });

  it('goes to the nearest record of the page when the query is not sorted by time', async () => {
    const walk = timelineWalk();
    await flush();

    // 10 to 30 minutes: 45% is 19 minutes, nearest to record 2 at 20
    walk.wrapper.findComponent({ name: 'TripTimelineBar' }).vm.$emit('seek', 45);
    await flush();

    expect(walk.current()).toEqual(['2']);
  });
});

describe('MapgridLayout — the capture card', () => {
  const cardWalk = (extra: Record<string, unknown> = {}) => {
    const fetchItems = vi.fn(async () => [{ id: 1, plate: 'RQP4C58', photo: 'file-1' }]);
    const walk = mountWalk({
      cameraTracking: 'off',
      props: {
        showCard: true,
        cardImageField: 'photo',
        gridFields: ['photo', 'plate'],
        fieldsInCollection: [
          { field: 'plate', name: 'Plate', type: 'string' },
          { field: 'photo', name: 'Photo', type: 'uuid' },
        ],
        fetchItems,
        assetUrl: (id: string) => `/assets/${id}`,
        ...extra,
      },
    });
    return { walk, fetchItems };
  };

  it('shows the focused record with its photo', async () => {
    const { walk, fetchItems } = cardWalk();
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('next');
    await flush();

    expect(fetchItems).toHaveBeenCalledWith([1], ['id', 'plate', 'photo']);
    expect(walk.wrapper.get('[data-capture-title]').text()).toBe('RQP4C58');
    expect(walk.wrapper.get('[data-capture-photo] img').attributes('src')).toBe('/assets/file-1');
  });

  it('stays closed for that record once dismissed', async () => {
    const { walk } = cardWalk();
    await walk.ready();
    await walk.press('next');
    await flush();

    walk.wrapper.findComponent({ name: 'CaptureCard' }).vm.$emit('close');
    await flush();

    expect(walk.wrapper.find('[data-capture-card]').exists()).toBe(false);
  });

  it('is not shown unless asked for', async () => {
    const { walk, fetchItems } = cardWalk({ showCard: false });
    await walk.ready();
    await walk.press('next');
    await flush();

    expect(walk.wrapper.find('[data-capture-card]').exists()).toBe(false);
    expect(fetchItems).not.toHaveBeenCalled();
  });
});

describe('MapgridLayout — measuring', () => {
  const clickTheMap = async (wrapper: VueWrapper, x: number, y: number): Promise<MouseEvent> => {
    const pane = wrapper.get('.mapgrid-pane--map').element;
    let canvas = pane.querySelector('.maplibregl-canvas-container');
    if (!canvas) {
      canvas = document.createElement('div');
      canvas.className = 'maplibregl-canvas-container';
      pane.appendChild(canvas);
    }
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });
    canvas.dispatchEvent(event);
    await nextTick();
    return event;
  };

  it('marks points where the map is clicked and adds up the distance', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    givePaneSize(walk.wrapper);
    await walk.ready();

    await walk.press('measure');
    await clickTheMap(walk.wrapper, 400, 200);
    // the record at 10° east, which the second point snaps to
    await clickTheMap(walk.wrapper, 400 + (4096 * 10) / 360 + 5, 203);

    expect(walk.wrapper.findAll('[data-measure-point]')).toHaveLength(2);
    expect(walk.wrapper.get('[data-measure-total]').text()).toBe('1,111.95 km');
  });

  it('keeps the click from the map, so measuring picks no record', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    givePaneSize(walk.wrapper);
    await walk.ready();
    await walk.press('measure');

    const event = await clickTheMap(walk.wrapper, 400, 200);

    expect(event.defaultPrevented).toBe(true);
    expect(walk.current()).toEqual([]);
  });

  it('forgets the points when turned off', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    givePaneSize(walk.wrapper);
    await walk.ready();
    await walk.press('measure');
    await clickTheMap(walk.wrapper, 400, 200);

    await walk.press('measure');
    await walk.press('measure');

    expect(walk.wrapper.findAll('[data-measure-point]')).toHaveLength(0);
  });
});

const tourStep = (): string | null =>
  document.querySelector('[data-tour-balloon]')?.getAttribute('data-tour-step') ?? null;

describe('MapgridLayout — the tour', () => {
  it('starts at the map and walks the features that are on screen', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    await walk.ready();

    await walk.press('tour');
    await flush();
    expect(tourStep()).toBe('map');

    walk.wrapper.findComponent({ name: 'TourBalloon' }).vm.$emit('next');
    await flush();
    // the Directus header is not in this test, so the filters balloon is skipped
    expect(tourStep()).toBe('grid');
    walk.wrapper.findComponent({ name: 'TourBalloon' }).vm.$emit('next');
    await flush();
    expect(tourStep()).toBe('navigation');
    walk.wrapper.unmount();
  });

  it('puts the second record in focus, so the arrow has one before it', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    await walk.ready();

    await walk.press('tour');
    await flush();

    expect(walk.current()).toEqual(['2']);
    walk.wrapper.unmount();
  });

  it('closes on Escape and answers the arrows while open', async () => {
    const walk = mountWalk({ cameraTracking: 'off' });
    await walk.ready();
    await walk.press('tour');
    await flush();

    await press('ArrowRight');
    await flush();
    expect(tourStep()).toBe('grid');
    // the arrow belonged to the tour, not to the records
    expect(walk.current()).toEqual(['2']);

    await press('Escape');
    await flush();
    expect(tourStep()).toBeNull();
    walk.wrapper.unmount();
  });

  it('opens by itself on the first visit only', async () => {
    vi.useFakeTimers();
    try {
      localStorage.clear();
      const first = mountWalk({
        cameraTracking: 'off',
        props: { tourOnFirstVisit: true, collection: 'lpr' },
      });
      await vi.advanceTimersByTimeAsync(1_600);
      await flush();
      expect(tourStep()).toBe('map');

      first.wrapper.findComponent({ name: 'TourBalloon' }).vm.$emit('close');
      await flush();
      first.wrapper.unmount();

      const second = mountWalk({
        cameraTracking: 'off',
        props: { tourOnFirstVisit: true, collection: 'lpr' },
      });
      await vi.advanceTimersByTimeAsync(1_600);
      await flush();
      expect(tourStep()).toBeNull();
      second.wrapper.unmount();
    } finally {
      vi.useRealTimers();
      localStorage.clear();
    }
  });
});
