import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('maplibre-gl', () => {
  class MockMap {
    on = vi.fn();
    addSource = vi.fn();
    addLayer = vi.fn();
    getSource = vi.fn();
    getCanvas = vi.fn(() => ({ style: { cursor: '' } }));
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
        stubs: {
          'v-button': {
            template: '<button class="v-button" @click="$emit(\'click\')"><slot /></button>',
            props: ['icon', 'rounded'],
          },
          'v-icon': {
            template: '<span class="v-icon" />',
            props: ['name'],
          },
        },
        directives: {
          tooltip: () => {},
        },
      },
    });
    expect(wrapper.find('.map-container').exists()).toBe(true);
  });

  it('should render reset button', () => {
    const wrapper = mount(MapComponent, {
      props: defaultProps,
      global: {
        stubs: {
          'v-button': {
            template:
              '<button class="v-button reset-map-btn" @click="$emit(\'click\')"><slot /></button>',
            props: ['icon', 'rounded'],
          },
          'v-icon': {
            template: '<span class="v-icon" />',
            props: ['name'],
          },
        },
        directives: {
          tooltip: () => {},
        },
      },
    });
    expect(wrapper.find('.reset-map-btn').exists()).toBe(true);
  });

  it('should expose focusOnItem method', () => {
    const wrapper = mount(MapComponent, {
      props: defaultProps,
      global: {
        stubs: {
          'v-button': {
            template: '<button class="v-button" @click="$emit(\'click\')"><slot /></button>',
            props: ['icon', 'rounded'],
          },
          'v-icon': {
            template: '<span class="v-icon" />',
            props: ['name'],
          },
        },
        directives: {
          tooltip: () => {},
        },
      },
    });
    expect(typeof wrapper.vm.focusOnItem).toBe('function');
  });
});
