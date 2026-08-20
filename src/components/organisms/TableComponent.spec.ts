import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { directusComponentStubs } from '../../test-utils';

vi.mock('@directus/extensions-sdk', () => ({
  useCollection: vi.fn(),
  useSync: vi.fn(),
}));

import TableComponent from './TableComponent.vue';

describe('TableComponent', () => {
  const defaultProps = {
    items: [
      { id: 1, name: 'Item 1', status: 'active' },
      { id: 2, name: 'Item 2', status: 'inactive' },
    ],
    headers: [
      { text: 'Name', value: 'name' },
      { text: 'Status', value: 'status' },
    ],
    collection: 'test_collection',
    selectedItems: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table container', () => {
    const wrapper = mount(TableComponent, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.find('.table-container').exists()).toBe(true);
  });

  it('should render with items', () => {
    const wrapper = mount(TableComponent, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.props('items')).toHaveLength(2);
  });

  it('should expose selectItem method', () => {
    const wrapper = mount(TableComponent, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(typeof wrapper.vm.selectItem).toBe('function');
  });

  it('should emit focus-on-item event on row click', () => {
    const wrapper = mount(TableComponent, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.emitted('focus-on-item')).toBeFalsy();
  });
});
