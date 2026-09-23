// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';

const maplibreState = vi.hoisted(() => ({
  instances: [] as Array<{ once: { mock: { calls: unknown[][] } } }>,
  boundsAreEmpty: true,
}));

vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      maplibreState.instances.push(this);
    }
    on = vi.fn();
    once = vi.fn();
    addSource = vi.fn();
    addLayer = vi.fn();
    getSource = vi.fn();
    getCanvas = vi.fn(() => ({ style: { cursor: '' } }));
    getCenter = vi.fn(() => ({ toArray: () => [-47.9292, -15.7801] }));
    getZoom = vi.fn(() => 4);
    getBounds = vi.fn(() => ({
      getWest: () => -180,
      getEast: () => 180,
      getSouth: () => -90,
      getNorth: () => 90,
    }));
    fitBounds = vi.fn();
    flyTo = vi.fn();
    easeTo = vi.fn();
    setCenter = vi.fn();
    setZoom = vi.fn();
    setPaintProperty = vi.fn();
    isStyleLoaded = vi.fn(() => true);
    querySourceFeatures = vi.fn(() => []);
    queryRenderedFeatures = vi.fn(() => []);
    remove = vi.fn();
  }

  class MockPopup {
    setLngLat = vi.fn().mockReturnThis();
    setHTML = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  class MockLngLatBounds {
    extend = vi.fn();
    isEmpty = vi.fn(() => maplibreState.boundsAreEmpty);
  }

  return {
    default: {
      Map: MockMap,
      Popup: MockPopup,
      Marker: MockMarker,
      LngLatBounds: MockLngLatBounds,
    },
  };
});

import { nextTick } from 'vue';
import MapComponent from './MapComponent.vue';

describe('MapComponent', () => {
  const defaultProps = {
    items: [{ id: 1, name: 'Test', position: { coordinates: [-47.9292, -15.7801] } }],
    geolocation: 'position',
    title: '{{name}}',
    zoomOnClick: false,
    centerLng: -47.9292,
    centerLat: -15.7801,
    initialZoom: 4,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    maplibreState.instances.length = 0;
    maplibreState.boundsAreEmpty = true;
  });

  it('should render map container', () => {
    const wrapper = mount(MapComponent, {
      props: defaultProps,
      global: {
        stubs: directusComponentStubs,
      },
    });
    expect(wrapper.find('.map-container').exists()).toBe(true);
  });

  it('should expose focusOnItem method', () => {
    const wrapper = mount(MapComponent, {
      props: defaultProps,
      global: {
        stubs: directusComponentStubs,
      },
    });
    expect(typeof wrapper.vm.focusOnItem).toBe('function');
  });

  /*
   * O enquadramento automatico anima (`fitBounds` com `duration`), e quem olha
   * de fora — o e2e — nao tem como distinguir "a camera parou porque o voo
   * acabou" de "a camera parou porque o voo ainda nem comecou". O componente
   * publica o fim do enquadramento inicial para que isso deixe de ser palpite.
   */
  describe('initial framing signal', () => {
    const initialFit = (wrapper: ReturnType<typeof mount>) =>
      (wrapper.find('.map-container').element as HTMLElement).dataset.initialFit;

    it('is only published when the framing animation ends', async () => {
      maplibreState.boundsAreEmpty = false;
      const wrapper = mount(MapComponent, {
        props: defaultProps,
        global: { stubs: directusComponentStubs },
      });
      await nextTick();
      await nextTick();

      expect(initialFit(wrapper)).toBeUndefined();

      const [instance] = maplibreState.instances;
      const moveEnd = instance?.once.mock.calls.find(([event]) => event === 'moveend');
      const onMoveEnd = moveEnd?.[1];
      if (typeof onMoveEnd !== 'function') throw new Error('no moveend handler was registered');
      onMoveEnd();

      expect(initialFit(wrapper)).toBe('done');
    });

    it('is published right away when there is nothing to frame', async () => {
      const wrapper = mount(MapComponent, {
        props: defaultProps,
        global: { stubs: directusComponentStubs },
      });
      await nextTick();
      await nextTick();

      expect(initialFit(wrapper)).toBe('done');
    });
  });
});
