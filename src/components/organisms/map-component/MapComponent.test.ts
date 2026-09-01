import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { directusComponentStubs, tooltipDirective } from '../../../mocks/directus-mocks.js';

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
    isEmpty = vi.fn(() => true);
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
        directives: { tooltip: tooltipDirective },
      },
    });
    expect(wrapper.find('.map-container').exists()).toBe(true);
  });

  it('should render reset button', () => {
    const wrapper = mount(MapComponent, {
      props: defaultProps,
      global: {
        stubs: directusComponentStubs,
        directives: { tooltip: tooltipDirective },
      },
    });
    expect(wrapper.find('.reset-map-btn').exists()).toBe(true);
  });

  it('should expose focusOnItem method', () => {
    const wrapper = mount(MapComponent, {
      props: defaultProps,
      global: {
        stubs: directusComponentStubs,
        directives: { tooltip: tooltipDirective },
      },
    });
    expect(typeof wrapper.vm.focusOnItem).toBe('function');
  });
});
