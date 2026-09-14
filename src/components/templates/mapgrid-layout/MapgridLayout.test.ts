// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks.js';
import MapgridLayout from './MapgridLayout.vue';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@directus/extensions-sdk', () => ({
  useSync: vi.fn(),
}));

describe('MapGridLayout', () => {
  it('should render loading state', () => {
    const wrapper = mount(MapgridLayout, {
      props: {
        items: [],
        loading: true,
        collection: 'test_collection',
        selectedItems: [],
      },
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.find('.v-info').exists()).toBe(true);
  });

  it('should render empty state', () => {
    const wrapper = mount(MapgridLayout, {
      props: {
        items: [],
        loading: false,
        collection: 'test_collection',
        selectedItems: [],
      },
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.find('.v-info').exists()).toBe(true);
  });
});
