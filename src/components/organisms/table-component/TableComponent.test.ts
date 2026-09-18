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

type TableWrapper = ReturnType<typeof mountTable>;

/** Both menus are popups, so a test reaches their items the way a user does. */
const openHeaderMenu = (wrapper: TableWrapper, field: string) =>
  wrapper.find(`[data-header="${field}"]`).trigger('click');

const openFieldPicker = (wrapper: TableWrapper) => wrapper.find('.add-field').trigger('click');

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

describe('TableComponent — sorting by the column header', () => {
  it('emits the new sort when the table reports one, instead of swallowing it', async () => {
    const wrapper = mountTable();

    wrapper.findComponent({ name: 'v-table' }).vm.$emit('update:sort', {
      by: 'status',
      desc: false,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:sort')?.[0]).toEqual([['status']]);
  });

  it('clears the sort when the table reports none, rather than keeping the old field', async () => {
    const wrapper = mountTable({ sort: ['status'] });

    wrapper.findComponent({ name: 'v-table' }).vm.$emit('update:sort', { by: null, desc: false });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:sort')?.[0]).toEqual([[]]);
  });

  it('leaves the actions column unsortable, because there is nothing to order by', () => {
    const headers = mountTable().findComponent({ name: 'v-table' }).props('headers') as {
      value: string;
      sortable: boolean;
    }[];

    expect(headers.find((header) => header.value === 'actions')?.sortable).toBe(false);
  });
});

describe('TableComponent — choosing columns from the header', () => {
  it('keeps the field picker shut until the header `+` is clicked', async () => {
    const wrapper = mountTable();

    expect(wrapper.findComponent({ name: 'v-field-list' }).exists()).toBe(false);

    await openFieldPicker(wrapper);

    expect(wrapper.findComponent({ name: 'v-field-list' }).exists()).toBe(true);
  });

  it('appends a field chosen from the picker, keeping the ones already there', async () => {
    const wrapper = mountTable({ headers: [{ text: 'Name', value: 'name' }] });
    await openFieldPicker(wrapper);

    wrapper.findComponent({ name: 'v-field-list' }).vm.$emit('add', ['city']);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:fields')?.[0]).toEqual([['name', 'city']]);
  });

  it('does not add a field twice, which would draw the same column again', async () => {
    const wrapper = mountTable({ headers: [{ text: 'Name', value: 'name' }] });
    await openFieldPicker(wrapper);

    wrapper.findComponent({ name: 'v-field-list' }).vm.$emit('add', ['name']);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:fields')).toBeUndefined();
  });

  it('greys out in the picker the columns already shown', async () => {
    const wrapper = mountTable({
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'City', value: 'city' },
      ],
    });
    await openFieldPicker(wrapper);

    expect(wrapper.findComponent({ name: 'v-field-list' }).props('disabledFields')).toEqual([
      'name',
      'city',
    ]);
  });

  it('removes a column and keeps the order of the rest', async () => {
    const wrapper = mountTable({
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'City', value: 'city' },
        { text: 'State', value: 'state' },
      ],
    });

    await openHeaderMenu(wrapper, 'city');
    await wrapper.find('[data-remove-field="city"]').trigger('click');

    expect(wrapper.emitted('update:fields')?.[0]).toEqual([['name', 'state']]);
  });
});

describe('TableComponent — sorting from the header context menu', () => {
  /*
   * O `v-table` do Directus troca o clique que ordena pelo menu de contexto
   * assim que o slot `header-context-menu` existe. Por isso o proprio layout
   * tabular poe "ordenar" dentro do menu — e por isso estes testes exercitam o
   * menu, e nao o clique no cabecalho.
   */
  it('hands the table the sort in the shape it speaks, and not the query format', () => {
    const wrapper = mountTable({ sort: ['-name'] });

    expect(wrapper.findComponent({ name: 'v-table' }).props('sort')).toEqual({
      by: 'name',
      desc: true,
    });
  });

  it('keeps the menu shut until the header is clicked, as the real table does', async () => {
    const wrapper = mountTable({ headers: [{ text: 'Name', value: 'name' }] });

    expect(wrapper.find('[data-sort-asc="name"]').exists()).toBe(false);

    await openHeaderMenu(wrapper, 'name');

    expect(wrapper.find('[data-sort-asc="name"]').exists()).toBe(true);
  });

  it('sorts ascending from the menu, writing the query format back', async () => {
    const wrapper = mountTable({ headers: [{ text: 'Name', value: 'name' }], sort: ['-name'] });

    await openHeaderMenu(wrapper, 'name');
    await wrapper.find('[data-sort-asc="name"]').trigger('click');

    expect(wrapper.emitted('update:sort')?.[0]).toEqual([['name']]);
  });

  it('sorts descending from the menu', async () => {
    const wrapper = mountTable({ headers: [{ text: 'Name', value: 'name' }], sort: ['name'] });

    await openHeaderMenu(wrapper, 'name');
    await wrapper.find('[data-sort-desc="name"]').trigger('click');

    expect(wrapper.emitted('update:sort')?.[0]).toEqual([['-name']]);
  });

  it('does not offer sorting on the actions column, which is not a field', async () => {
    const wrapper = mountTable();

    await openHeaderMenu(wrapper, 'actions');

    expect(wrapper.find('[data-sort-asc="actions"]').exists()).toBe(false);
  });
});

describe('TableComponent — reordering columns by dragging the header', () => {
  it('lets the table reorder the headers, which the tabular layout allows too', () => {
    const wrapper = mountTable();
    const table = wrapper.findComponent({ name: 'v-table' });

    expect(table.props('allowHeaderReorder')).toBe(true);
  });

  it('turns a reordered header list back into the chosen fields, in the new order', async () => {
    const wrapper = mountTable({
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'City', value: 'city' },
      ],
    });

    wrapper.findComponent({ name: 'v-table' }).vm.$emit('update:headers', [
      { text: 'City', value: 'city' },
      { text: 'Name', value: 'name' },
    ]);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:fields')?.[0]).toEqual([['city', 'name']]);
  });

  it('leaves the actions column out of what it writes back, because it is not a field', async () => {
    const wrapper = mountTable({ headers: [{ text: 'Name', value: 'name' }] });

    wrapper.findComponent({ name: 'v-table' }).vm.$emit('update:headers', [
      { text: 'Name', value: 'name' },
      { text: '', value: 'actions' },
    ]);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:fields')?.[0]).toEqual([['name']]);
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
