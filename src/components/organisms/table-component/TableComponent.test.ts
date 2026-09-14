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

describe('TableComponent — a grade dos itens', () => {
  it('desenha uma linha por item', () => {
    const kind = mappableKind('pontos_turisticos');
    const wrapper = mountTable();

    expect(wrapper.findAll('tbody tr')).toHaveLength(kind.items.length);
  });

  it('mostra o estado vazio, e não uma tabela só com cabeçalho', () => {
    const wrapper = mountTable({ items: [] });

    expect(wrapper.find('.v-info').exists()).toBe(true);
    expect(wrapper.find('tbody').exists()).toBe(false);
  });

  it('acrescenta a coluna de ações depois das colunas configuradas', () => {
    const table = mountTable().findComponent({ name: 'v-table' });
    const headers = table.props('headers') as { value: string; sortable: boolean }[];
    const last = headers[headers.length - 1];

    expect(last?.value).toBe('actions');
    expect(last?.sortable).toBe(false);
  });
});

describe('TableComponent — clicar numa linha leva o mapa até o item', () => {
  it('emite focus-on-item com o item clicado', async () => {
    const wrapper = mountTable();
    const item = mappableKind('pontos_turisticos').items[1];

    wrapper.findComponent({ name: 'v-table' }).vm.$emit('click:row', { item });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('focus-on-item')?.[0]).toEqual([item]);
  });

  it('expõe selectItem, que é como o mapa devolve o destaque para a grade', () => {
    const wrapper = mountTable();

    expect(typeof wrapper.vm.selectItem).toBe('function');
  });
});

describe('TableComponent — permissões da coleção', () => {
  it('esconde o ícone de editar quando a permissão não existe', () => {
    const wrapper = mountTable({ canEdit: false });

    expect(wrapper.find('.action-icon').exists()).toBe(false);
  });

  it('mostra o ícone de editar quando a permissão existe', () => {
    const wrapper = mountTable({ canEdit: true });

    expect(wrapper.find('.action-icon').exists()).toBe(true);
  });
});
