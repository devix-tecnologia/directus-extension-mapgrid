import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { DirectusMockComponents } from '../../../mocks/directus-mocks.js';
import MapgridLayout from './MapgridLayout.vue';
import { mockLayoutItems } from './MapgridLayout.mock';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('MapgridLayout', () => {
  const global = {
    stubs: {
      ...DirectusMockComponents,
      MapComponent: true,
      TableComponent: true,
    },
  };

  it('shows the loading state', () => {
    const wrapper = mount(MapgridLayout, {
      props: {
        items: [],
        loading: true,
        collection: 'mapgrid',
      },
      global,
    });

    expect(wrapper.text()).toContain('Loading...');
  });

  it('shows the empty state', () => {
    const wrapper = mount(MapgridLayout, {
      props: {
        items: [],
        collection: 'mapgrid',
      },
      global,
    });

    expect(wrapper.text()).toContain('No items found');
  });

  it('renders map and table when there are items', () => {
    const wrapper = mount(MapgridLayout, {
      props: {
        items: mockLayoutItems,
        collection: 'mapgrid',
        coluna1: 'id',
        coluna2: 'nome',
        geolocation: 'localizacao',
        title: '{{nome}}',
      },
      global,
    });

    expect(wrapper.find('.mapgrid-container').exists()).toBe(true);
  });
});
