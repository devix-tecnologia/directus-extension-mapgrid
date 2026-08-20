import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

vi.mock('@directus/extensions-sdk', () => ({
  useCollection: vi.fn(() => ({
    fields: ref([]),
  })),
  useSync: vi.fn((props, key, emit) => {
    return computed({
      get: () => props[key],
      set: (val) => emit(`update:${key}`, val),
    });
  }),
}));

import { mount } from '@vue/test-utils';
import MapGridOptions from './MapGridOptions.vue';

describe('MapGridOptions', () => {
  const defaultProps = {
    collection: 'test_collection',
    layoutOptions: {},
    fieldsInCollection: [
      { name: 'Name', field: 'name' },
      { name: 'Status', field: 'status' },
      { name: 'Position', field: 'position', meta: { interface: 'map' } },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render options container', () => {
    const wrapper = mount(MapGridOptions, {
      props: defaultProps,
      global: {
        stubs: {
          'v-detail': {
            template: '<div class="v-detail"><slot /></div>',
            props: ['icon', 'header'],
          },
          'v-select': {
            template: '<div class="v-select" />',
            props: [
              'modelValue',
              'collection',
              'items',
              'itemText',
              'itemValue',
              'placeholder',
              'showDeselect',
            ],
          },
          'v-input': {
            template: '<div class="v-input" />',
            props: ['modelValue', 'label', 'placeholder', 'type', 'step', 'min', 'max'],
          },
          'v-checkbox': {
            template: '<div class="v-checkbox" />',
            props: ['modelValue', 'label'],
          },
          'v-collection-field-template': {
            template: '<div class="v-collection-field-template" />',
            props: ['modelValue', 'collection'],
          },
        },
      },
    });
    expect(wrapper.find('.field').exists()).toBe(true);
  });

  it('should render multiple option sections', () => {
    const wrapper = mount(MapGridOptions, {
      props: defaultProps,
      global: {
        stubs: {
          'v-detail': {
            template: '<div class="v-detail"><slot /></div>',
            props: ['icon', 'header'],
          },
          'v-select': {
            template: '<div class="v-select" />',
            props: [
              'modelValue',
              'collection',
              'items',
              'itemText',
              'itemValue',
              'placeholder',
              'showDeselect',
            ],
          },
          'v-input': {
            template: '<div class="v-input" />',
            props: ['modelValue', 'label', 'placeholder', 'type', 'step', 'min', 'max'],
          },
          'v-checkbox': {
            template: '<div class="v-checkbox" />',
            props: ['modelValue', 'label'],
          },
          'v-collection-field-template': {
            template: '<div class="v-collection-field-template" />',
            props: ['modelValue', 'collection'],
          },
        },
      },
    });
    expect(wrapper.findAll('.v-detail').length).toBeGreaterThan(0);
  });
});
