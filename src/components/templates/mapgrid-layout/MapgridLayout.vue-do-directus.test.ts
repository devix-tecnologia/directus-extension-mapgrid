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
  version,
} from 'vue';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { EmbeddedLayout } from '../../../services/embedded-layout/index';
import MapgridLayout from './MapgridLayout.vue';

it('runs with the Directus Vue the e2e uses, and not with the project one', () => {
  expect(version).toBe('3.4.27');
});

/**
 * Without this guard the whole file lies: if `mount` mounts with another Vue,
 * the state the test creates belongs to one reactivity and the render effect to
 * another, nothing propagates, and every component test here fails with no
 * defect at all.
 */
it('mounts with that same Vue: one reactivity, not two', () => {
  const component = defineComponent({ setup: () => () => h('div') });
  const app = (mount(component).vm.$ as { appContext: { app: { version: string } } }).appContext
    .app;
  expect(app.version).toBe(version);
});

function fakeEmbedded(id: string, state: Record<string, unknown>) {
  const received: { attrs: Record<string, unknown> } = { attrs: {} };
  const component = defineComponent({
    inheritAttrs: false,
    name: `embedded-${id}`,
    setup() {
      received.attrs = useAttrs();
      return () => h('div', { class: `embedded-${id}` });
    },
  });
  const embedded: EmbeddedLayout = { component, id, optionsComponent: null, state };
  return { embedded, received };
}

describe('native geometry: delivering to the map after fetching what the grid did not bring', () => {
  const RIO_SP = {
    coordinates: [
      [-43.1729, -22.9068],
      [-46.6333, -23.5505],
    ],
    type: 'LineString',
  };
  const MANAUS_BELEM = {
    coordinates: [
      [-60.0255, -3.119],
      [-48.5044, -1.4558],
    ],
    type: 'LineString',
  };
  const awaitFetch = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('after a first flight, the map layout receives the bounds of the fetched item', async () => {
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
    const featureOf = (id: number, geometry: unknown) => ({
      geometry,
      properties: { id },
      type: 'Feature',
    });
    // as embedLayout does: the return of their setup(), with refs, inside a reactive
    const state = reactive<Record<string, unknown>>({
      cameraOptions: ref<unknown>(undefined),
      featureId: ref('id'),
      fitDataBounds: vi.fn(),
      geojson: ref({
        bbox: [-60.0255, -23.5505, -43.1729, -1.4558],
        features: [featureOf(1, RIO_SP), featureOf(2, MANAUS_BELEM)],
        type: 'FeatureCollection',
      }),
      geojsonBounds: ref<unknown>(undefined),
      geometryField: ref('route'),
      isGeometryFieldNative: ref(true),
      selection: ref([]),
    });
    const map: EmbeddedLayout = {
      component: mapLayout,
      id: 'map',
      optionsComponent: null,
      state,
    };
    const grid = fakeEmbedded('tabular', {
      items: [
        { id: 1, name: 'Rio → São Paulo' },
        { id: 2, name: 'Manaus → Belém' },
      ],
    });
    const fetchItems = vi.fn(async () => [{ id: 2, route: MANAUS_BELEM }]);
    mount(MapgridLayout, {
      props: { fetchItems, grid: grid.embedded, map },
      global: { components: directusComponentStubs },
    });
    const onRowClick = grid.received.attrs.onRowClick as (payload: unknown) => void;

    // the click arrives before the loading moveend, as in the e2e
    onRowClick({ item: { id: 1, name: 'Rio → São Paulo' } });
    await nextTick();
    state.cameraOptions = { bbox: [-180, -85, 180, 85], zoom: 1 };
    await nextTick();

    // the flight ended at Rio–SP, and Directus refetched only what is on screen
    state.cameraOptions = { bbox: [-47.7, -24.1, -42.1, -22.3], zoom: 8 };
    state.geojson = {
      bbox: [-46.6333, -23.5505, -43.1729, -22.9068],
      features: [featureOf(1, RIO_SP)],
      type: 'FeatureCollection',
    };
    await nextTick();

    onRowClick({ item: { id: 2, name: 'Manaus → Belém' } });
    await awaitFetch();
    await nextTick();

    expect(fetchItems).toHaveBeenCalledWith([2], ['id', 'route']);
    expect(receivedBounds[receivedBounds.length - 1]).toEqual([
      -60.0255, -3.119, -48.5044, -1.4558,
    ]);
  });
});

/**
 * The Directus map layout's `showingCount` calls `useI18n()` from inside a
 * `computed` getter, and outside a render vue-i18n throws. The Vue scheduler
 * re-evaluates that getter with no current instance while checking whether our
 * render effect is dirty: if the throw crosses our state read it takes the
 * whole check down, the composition stops repainting, and fresh
 * `geojsonBounds` never reaches the map.
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
