// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { mappableKind } from '../../../mocks/mappable-mocks';
import { layoutPropsFor } from './MapgridLayout.mock';
import MapgridLayout from './MapgridLayout.vue';

/**
 * The real map needs WebGL, which happy-dom does not have. What matters here is
 * the layout's wiring — which props go down and which events come up — not the
 * drawing of the map, which MapComponent.test.ts covers with a fake maplibre.
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

describe('MapgridLayout — what shows while the items are not ready', () => {
  it('shows the loading notice and no map, so it does not draw an empty map that changes at once', () => {
    const wrapper = mountLayout({ loading: true, items: [] });

    expect(wrapper.find('.v-info').exists()).toBe(true);
    expect(wrapper.find('.mapgrid-container').exists()).toBe(false);
  });

  it('shows the empty state when the filter returned nothing', () => {
    const wrapper = mountLayout({ loading: false, items: [] });

    expect(wrapper.find('.v-info').exists()).toBe(true);
    expect(wrapper.find('.mapgrid-container').exists()).toBe(false);
  });

  it('draws map and grid together as soon as there are items', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('.mapgrid-container').exists()).toBe(true);
    expect(wrapper.find('.v-info').exists()).toBe(false);
  });
});

describe('MapgridLayout — the grid columns come from the preset', () => {
  it('builds one header per configured column', () => {
    const kind = mappableKind('landmarks');
    const wrapper = mountLayout();
    const table = wrapper.findComponent({ name: 'v-table' });

    expect(table.props('headers')).toHaveLength(kind.columns.length + 1);
  });

  it('closes the gaps, so a blank column 2 does not open a headerless space', () => {
    const wrapper = mountLayout({
      coluna1: 'name',
      coluna2: undefined,
      coluna3: 'city',
      coluna4: undefined,
      coluna5: undefined,
    });
    const table = wrapper.findComponent({ name: 'v-table' });
    const values = (table.props('headers') as { value: string }[]).map((header) => header.value);

    expect(values).toEqual(['name', 'city', 'actions']);
  });
});

describe('MapgridLayout — the selection belongs to the layout, which hands it to the delete action', () => {
  it('passes up what the grid selected, instead of keeping a copy of its own', async () => {
    const wrapper = mountLayout();
    const items = mappableKind('landmarks').items.slice(0, 2);

    wrapper.findComponent({ name: 'TableComponent' }).vm.$emit('update:selectedItems', items);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:selectedItems')?.[0]).toEqual([items]);
  });

  it('emits edit-item instead of navigating, so the host decides what to open', async () => {
    const wrapper = mountLayout();
    const item = mappableKind('landmarks').items[0];

    wrapper.findComponent({ name: 'TableComponent' }).vm.$emit('edit-item', item);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('edit-item')?.[0]).toEqual([item]);
  });
});
