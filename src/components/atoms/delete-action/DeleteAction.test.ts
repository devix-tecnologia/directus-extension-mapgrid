import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks.js';
import DeleteAction from './DeleteAction.vue';

describe('DeleteAction', () => {
  const defaultProps = {
    selectedItems: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
    deleteSelectedItems: vi.fn().mockResolvedValue(undefined),
  };

  it('should render delete button when items selected', () => {
    const wrapper = mount(DeleteAction, {
      props: defaultProps,
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.find('.delete-btn').exists()).toBe(true);
  });

  it('should not render delete button when no items selected', () => {
    const wrapper = mount(DeleteAction, {
      props: { ...defaultProps, selectedItems: [] },
      global: { stubs: directusComponentStubs },
    });
    expect(wrapper.find('.delete-btn').exists()).toBe(false);
  });
});
