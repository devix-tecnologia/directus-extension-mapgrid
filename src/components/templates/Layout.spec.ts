import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MapGridLayout from './MapGridLayout.vue';

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
    const wrapper = mount(MapGridLayout, {
      props: {
        items: [],
        loading: true,
        collection: 'test_collection',
        selectedItems: [],
      },
      global: {
        stubs: {
          'v-info': {
            template: '<div class="v-info"><slot /><slot name="append" /></div>',
            props: ['icon', 'title', 'center'],
          },
          'v-progress-circular': {
            template: '<div class="v-progress" />',
            props: ['indeterminate'],
          },
        },
      },
    });
    expect(wrapper.find('.v-info').exists()).toBe(true);
  });

  it('should render empty state', () => {
    const wrapper = mount(MapGridLayout, {
      props: {
        items: [],
        loading: false,
        collection: 'test_collection',
        selectedItems: [],
      },
      global: {
        stubs: {
          'v-info': {
            template: '<div class="v-info"><slot /><slot name="append" /></div>',
            props: ['icon', 'title', 'center'],
          },
          'v-progress-circular': {
            template: '<div class="v-progress" />',
            props: ['indeterminate'],
          },
        },
      },
    });
    expect(wrapper.find('.v-info').exists()).toBe(true);
  });
});
