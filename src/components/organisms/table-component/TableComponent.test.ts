// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { mappableKind } from '../../../mocks/mappable-mocks';
import { tablePropsFor } from './TableComponent.mock';
import TableComponent from './TableComponent.vue';

const mountTable = (props: Partial<ReturnType<typeof tablePropsFor>> = {}) =>
  mount(TableComponent, {
    props: { ...tablePropsFor(), ...props },
    global: { stubs: directusComponentStubs },
  });

describe('TableComponent — the item grid', () => {
  it('draws one row per item', () => {
    const kind = mappableKind('landmarks');
    const wrapper = mountTable();

    expect(wrapper.findAll('tbody tr')).toHaveLength(kind.items.length);
  });

  it('shows the empty state, not a table with only a header', () => {
    const wrapper = mountTable({ items: [] });

    expect(wrapper.find('.v-info').exists()).toBe(true);
    expect(wrapper.find('tbody').exists()).toBe(false);
  });

  it('appends the actions column after the configured ones', () => {
    const table = mountTable().findComponent({ name: 'v-table' });
    const headers = table.props('headers') as { value: string; sortable: boolean }[];
    const last = headers[headers.length - 1];

    expect(last?.value).toBe('actions');
    expect(last?.sortable).toBe(false);
  });
});

describe('TableComponent — clicking a row takes the map to the item', () => {
  it('emits focus-on-item with the clicked item', async () => {
    const wrapper = mountTable();
    const item = mappableKind('landmarks').items[1];

    wrapper.findComponent({ name: 'v-table' }).vm.$emit('click:row', { item });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('focus-on-item')?.[0]).toEqual([item]);
  });

  it('exposes selectItem, which is how the map hands the highlight back to the grid', () => {
    const wrapper = mountTable();

    expect(typeof wrapper.vm.selectItem).toBe('function');
  });
});

describe('TableComponent — collection permissions', () => {
  it('hides the edit icon when the permission is absent', () => {
    const wrapper = mountTable({ canEdit: false });

    expect(wrapper.find('.action-icon').exists()).toBe(false);
  });

  it('shows the edit icon when the permission is present', () => {
    const wrapper = mountTable({ canEdit: true });

    expect(wrapper.find('.action-icon').exists()).toBe(true);
  });
});
