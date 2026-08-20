import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const { mapInstance, MockMap, MockBounds, MockPopup, MockMarker } = vi.hoisted(() => {
  const mapInstance = {
    on: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn(() => ({
      setData: vi.fn(),
      getClusterExpansionZoom: vi.fn(() => Promise.resolve(12)),
    })),
    querySourceFeatures: vi.fn(() => []),
    queryRenderedFeatures: vi.fn(() => []),
    setPaintProperty: vi.fn(),
    getCanvas: vi.fn(() => ({ style: {} })),
    getBounds: vi.fn(() => ({
      getWest: () => 0,
      getEast: () => 1,
      getSouth: () => 0,
      getNorth: () => 1,
    })),
    flyTo: vi.fn(),
    easeTo: vi.fn(),
    fitBounds: vi.fn(),
    resize: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    remove: vi.fn(),
  };

  class MockMap {
    constructor() {
      return mapInstance;
    }
  }

  class MockBounds {
    extend(): void {}
    isEmpty(): boolean {
      return true;
    }
  }

  class MockPopup {
    setLngLat(): this {
      return this;
    }
    setHTML(): this {
      return this;
    }
    addTo(): this {
      return this;
    }
    remove(): void {}
  }

  class MockMarker {
    setLngLat(): this {
      return this;
    }
    addTo(): this {
      return this;
    }
    remove(): void {}
  }

  return { mapInstance, MockMap, MockBounds, MockPopup, MockMarker };
});

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MockMap,
    LngLatBounds: MockBounds,
    Popup: MockPopup,
    Marker: MockMarker,
  },
}));

import MapComponent from './map-component.vue';
import { DirectusMockComponents } from '../../../mocks/directus-mocks.js';
import { mockGeoItems } from './map-component.mock';

describe('MapComponent', () => {
  it('instantiates the map on mount', () => {
    const wrapper = mount(MapComponent, {
      props: {
        items: mockGeoItems,
        geolocation: 'localizacao',
        title: '{{nome}}',
      },
      global: {
        stubs: {
          ...DirectusMockComponents,
          MapToolbar: true,
        },
      },
    });

    expect(wrapper.find('.map-container').exists()).toBe(true);
    expect(mapInstance.on).toHaveBeenCalled();
  });

  it('renders the toolbar reset button', () => {
    const wrapper = mount(MapComponent, {
      props: {
        items: mockGeoItems,
        geolocation: 'localizacao',
        title: '{{nome}}',
      },
      global: {
        stubs: DirectusMockComponents,
      },
    });

    expect(wrapper.find('button.v-button-mock').exists()).toBe(true);
  });
});
