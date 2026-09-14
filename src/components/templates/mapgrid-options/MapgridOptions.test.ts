// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

vi.mock('@directus/extensions-sdk', () => ({
  useCollection: vi.fn(() => ({
    fields: ref([]),
  })),
  useSync: vi.fn(
    (
      props: Record<string, unknown>,
      key: string,
      emit: (event: string, ...args: unknown[]) => void
    ) => {
      return computed({
        get: () => props[key],
        set: (val: unknown) => emit(`update:${key}`, val),
      });
    }
  ),
}));

import { mount } from '@vue/test-utils';
import { directusComponentStubs } from '../../../mocks/directus-mocks.js';
import MapgridOptions from './MapgridOptions.vue';

describe('MapgridOptions', () => {
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
    const wrapper = mount(MapgridOptions, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.find('.field').exists()).toBe(true);
  });

  it('should render multiple option sections', () => {
    const wrapper = mount(MapgridOptions, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.findAll('.v-detail').length).toBeGreaterThan(0);
  });
});
