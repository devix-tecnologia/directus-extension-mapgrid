// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';

const maplibre = vi.hoisted(() => ({
  maps: [] as Array<{ fitBounds: Mock }>,
}));

vi.mock('maplibre-gl', () => {
  class MockMap {
    on = vi.fn();
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

    constructor() {
      maplibre.maps.push(this);
    }
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
    isEmpty = vi.fn(() => false);
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
});

describe('MapComponent — the initial framing runs once, not on every item change', () => {
  const item = (id: number, coords: [number, number]) => ({
    id,
    name: `Item ${id}`,
    position: { coordinates: coords },
  });

  const mountMap = (items: ReturnType<typeof item>[]) =>
    mount(MapComponent, {
      props: {
        items,
        geolocation: 'position',
        title: '{{name}}',
        zoomOnClick: false,
        mapCenterLng: -47.9292,
        mapCenterLat: -15.7801,
        mapZoom: 4,
      },
      global: {
        stubs: directusComponentStubs,
      },
    });

  beforeEach(() => {
    maplibre.maps.length = 0;
  });

  it('does not re-frame when the items change, so a page swap cannot pull the camera back', async () => {
    const wrapper = mountMap([item(1, [-47.9292, -15.7801])]);

    await flushPromises();
    const map = maplibre.maps[0];
    expect(map).toBeDefined();
    expect(map?.fitBounds).toHaveBeenCalledTimes(1);

    await wrapper.setProps({
      items: [item(1, [-47.9292, -15.7801]), item(2, [-46.6333, -23.5505])],
    });
    await flushPromises();

    expect(map?.fitBounds).toHaveBeenCalledTimes(1);
  });
});
