import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { DirectusMockComponents } from '../../../mocks/directus-mocks.js';
import TableComponent from './TableComponent.vue';
import { mockTableHeaders, mockTableItems } from './TableComponent.mock';

describe('TableComponent', () => {
  const global = { stubs: DirectusMockComponents };

  it('renders the headers and items', () => {
    const wrapper = mount(TableComponent, {
      props: {
        items: mockTableItems,
        headers: mockTableHeaders,
        collection: 'mapgrid',
      },
      global,
    });

    expect(wrapper.text()).toContain('Nome');
    expect(wrapper.text()).toContain('Praça São Paulo');
  });

  it('emits focus-on-item when a row is clicked', async () => {
    const wrapper = mount(TableComponent, {
      props: {
        items: mockTableItems,
        headers: mockTableHeaders,
        collection: 'mapgrid',
      },
      global,
    });

    const rows = wrapper.findAll('tbody tr');
    await rows[0]!.trigger('click');
    expect(wrapper.emitted('focus-on-item')).toBeTruthy();
    expect(wrapper.emitted('focus-on-item')![0]![0]).toMatchObject({ id: 1 });
  });

  it('shows the empty state when there are no items', () => {
    const wrapper = mount(TableComponent, {
      props: {
        items: [],
        headers: mockTableHeaders,
        collection: 'mapgrid',
      },
      global,
    });

    expect(wrapper.text()).toContain('No items found');
  });
});
