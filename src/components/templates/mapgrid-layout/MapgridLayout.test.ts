// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
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
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
import MapgridLayout from './MapgridLayout.vue';

/**
 * A fake embedded layout: its component draws nothing, it only keeps the
 * attributes it received. Those attributes are how the composition talks to the
 * Directus layouts — `onRowClick` and `handleClick` arrive that way — so they
 * are what a template test needs to see.
 */
function fakeEmbedded(id: string, state: Record<string, unknown>) {
  const received: { attrs: Record<string, unknown> } = { attrs: {} };

  const component = defineComponent({
    name: `embedded-${id}`,
    inheritAttrs: false,
    setup() {
      received.attrs = useAttrs();
      return () => h('div', { class: `embedded-${id}` });
    },
  });

  const embedded: EmbeddedLayout = { id, state, component, optionsComponent: null };
  return { embedded, received };
}

const BRASILIA: [number, number] = [-47.9292, -15.7801];

interface Composition {
  mapAttrs: Record<string, unknown>;
  gridAttrs: Record<string, unknown>;
  updateSelection: ReturnType<typeof vi.fn>;
  theirHandleClick: ReturnType<typeof vi.fn>;
}

function mountComposition(initialSelection: (string | number)[] = []): Composition {
  const updateSelection = vi.fn();
  const theirHandleClick = vi.fn();

  const map = fakeEmbedded('map', {
    geometryField: 'location',
    selection: initialSelection,
    'onUpdate:selection': updateSelection,
    handleClick: theirHandleClick,
    cameraOptions: { center: [0, 0], zoom: 3 },
    'onUpdate:cameraOptions': vi.fn(),
  });

  const grid = fakeEmbedded('tabular', { items: [], onRowClick: vi.fn() });

  mount(MapgridLayout, {
    props: { grid: grid.embedded, map: map.embedded },
    global: { components: directusComponentStubs },
  });

  return {
    mapAttrs: map.received.attrs,
    gridAttrs: grid.received.attrs,
    updateSelection,
    theirHandleClick,
  };
}

const clickMarker = (composition: Composition, payload: unknown): void => {
  const handleClick = composition.mapAttrs.handleClick as (payload: unknown) => void;
  handleClick(payload);
};

describe('MapgridLayout — the marker click', () => {
  it('selects the grid row instead of navigating to the item screen', () => {
    const composition = mountComposition();

    clickMarker(composition, { id: 3, replace: false });

    expect(composition.updateSelection).toHaveBeenCalledWith([3]);
    expect(composition.theirHandleClick).not.toHaveBeenCalled();
  });

  it('adds to the selection that already exists, like the grid checkbox', () => {
    const composition = mountComposition([1]);

    clickMarker(composition, { id: 3 });

    expect(composition.updateSelection).toHaveBeenCalledWith([1, 3]);
  });

  it('unmarks the marker that was already selected', () => {
    const composition = mountComposition([1, 3]);

    clickMarker(composition, { id: 3 });

    expect(composition.updateSelection).toHaveBeenCalledWith([1]);
  });

  it('ignores a click that brings no item, like one on the open sea', () => {
    const composition = mountComposition([1]);

    clickMarker(composition, { id: undefined });
    clickMarker(composition, null);

    expect(composition.updateSelection).not.toHaveBeenCalled();
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
