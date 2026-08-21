import { describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';

vi.mock('@directus/extensions-sdk', () => ({
  useCollection: () => ({
    fields: ref([
      {
        collection: 'mapgrid',
        field: 'id',
        schema: { is_primary_key: true, default_value: null },
        meta: null,
      },
      {
        collection: 'mapgrid',
        field: 'localizacao',
        schema: null,
        meta: { interface: 'map' },
      },
    ]),
  }),
  useSync: (props: Record<string, unknown>, key: string, emit: (e: string, v: unknown) => void) =>
    computed({
      get: () => props[key],
      set: (value: unknown) => emit(`update:${key}`, value),
    }),
}));

import MapgridOptions from './MapgridOptions.vue';

describe('MapgridOptions', () => {
  const stubs = {
    'v-detail': {
      props: ['header'],
      template: '<div class="v-detail-stub"><div class="v-detail-header">{{ header }}</div><slot /></div>',
    },
    'v-collection-field-template': {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<input :value="modelValue" />',
    },
    'v-select': {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<select :value="modelValue" />',
    },
    'v-checkbox': {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template: '<input type="checkbox" :checked="modelValue" />',
    },
  };

  it('renders the option sections', () => {
    const wrapper = mount(MapgridOptions, {
      props: {
        collection: 'mapgrid',
        layoutOptions: {},
        fieldsInCollection: [],
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Popup Pin Map');
    expect(wrapper.text()).toContain('Geolocation');
    expect(wrapper.text()).toContain('Zoom on Table Click');
    expect(wrapper.text()).toContain('Table Columns');
  });
});
