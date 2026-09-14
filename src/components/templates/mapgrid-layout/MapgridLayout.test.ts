// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { mappableKind } from '../../../mocks/mappable-mocks';
import { layoutPropsFor } from './MapgridLayout.mock';
import MapgridLayout from './MapgridLayout.vue';

/**
 * O mapa de verdade pede WebGL, que o happy-dom não tem. O que interessa aqui é
 * a fiação do layout — quais props descem e quais eventos sobem — e não o
 * desenho do mapa, que o MapComponent.test.ts cobre com o maplibre falso.
 */
const MapComponentStub = {
  name: 'MapComponent',
  props: [
    'items',
    'geolocation',
    'title',
    'zoomOnClick',
    'mapCenterLng',
    'mapCenterLat',
    'mapZoom',
  ],
  template: '<div class="map-stub" />',
  methods: { focusOnItem: () => undefined },
};

const mountLayout = (props: Partial<ReturnType<typeof layoutPropsFor>> = {}) =>
  mount(MapgridLayout, {
    props: { ...layoutPropsFor(), ...props },
    global: { stubs: { ...directusComponentStubs, MapComponent: MapComponentStub } },
  });

describe('MapgridLayout — o que aparece enquanto os itens não estão prontos', () => {
  it('mostra o aviso de carregamento e nenhum mapa, para não desenhar um mapa vazio que logo muda', () => {
    const wrapper = mountLayout({ loading: true, items: [] });

    expect(wrapper.find('.v-info').exists()).toBe(true);
    expect(wrapper.find('.mapgrid-container').exists()).toBe(false);
  });

  it('mostra o estado vazio quando o filtro não devolveu nada', () => {
    const wrapper = mountLayout({ loading: false, items: [] });

    expect(wrapper.find('.v-info').exists()).toBe(true);
    expect(wrapper.find('.mapgrid-container').exists()).toBe(false);
  });

  it('desenha mapa e grade juntos assim que há itens', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('.mapgrid-container').exists()).toBe(true);
    expect(wrapper.find('.v-info').exists()).toBe(false);
  });
});

describe('MapgridLayout — as colunas da grade vêm do preset', () => {
  it('monta um cabeçalho por coluna configurada', () => {
    const kind = mappableKind('pontos_turisticos');
    const wrapper = mountLayout();
    const table = wrapper.findComponent({ name: 'v-table' });

    expect(table.props('headers')).toHaveLength(kind.columns.length + 1);
  });

  it('fecha os buracos, para uma coluna 2 em branco não abrir espaço sem cabeçalho', () => {
    const wrapper = mountLayout({
      coluna1: 'nome',
      coluna2: undefined,
      coluna3: 'cidade',
      coluna4: undefined,
      coluna5: undefined,
    });
    const table = wrapper.findComponent({ name: 'v-table' });
    const values = (table.props('headers') as { value: string }[]).map((header) => header.value);

    expect(values).toEqual(['nome', 'cidade', 'actions']);
  });
});

describe('MapgridLayout — a seleção pertence ao layout, que a envia para a exclusão', () => {
  it('repassa para cima o que a grade selecionou, em vez de guardar uma cópia própria', async () => {
    const wrapper = mountLayout();
    const items = mappableKind('pontos_turisticos').items.slice(0, 2);

    wrapper.findComponent({ name: 'TableComponent' }).vm.$emit('update:selectedItems', items);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:selectedItems')?.[0]).toEqual([items]);
  });

  it('emite edit-item em vez de navegar, para quem hospeda decidir o que abrir', async () => {
    const wrapper = mountLayout();
    const item = mappableKind('pontos_turisticos').items[0];

    wrapper.findComponent({ name: 'TableComponent' }).vm.$emit('edit-item', item);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('edit-item')?.[0]).toEqual([item]);
  });
});
