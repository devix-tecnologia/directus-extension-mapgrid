// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { optionsPropsFor } from './MapgridOptions.mock';
import MapgridOptions from './MapgridOptions.vue';

const mountOptions = (props: Partial<ReturnType<typeof optionsPropsFor>> = {}) =>
  mount(MapgridOptions, {
    props: { ...optionsPropsFor(), ...props },
    global: { stubs: directusComponentStubs },
  });

describe('MapgridOptions — the panel sections', () => {
  it('opens one section per option group', () => {
    const wrapper = mountOptions();

    expect(wrapper.findAll('.v-detail').length).toBe(5);
  });

  it('offers a picker for adding fields, rather than a fixed number of slots', () => {
    const wrapper = mountOptions();

    expect(wrapper.findComponent({ name: 'v-field-list' }).exists()).toBe(true);
  });
});

describe('MapgridOptions — the geolocation select', () => {
  it('offers map fields only, because a text field does not hold a point', () => {
    const wrapper = mountOptions({
      fieldsInCollection: [
        { name: 'Name', field: 'name', meta: null },
        { name: 'Site', field: 'site', meta: { interface: 'map' } },
        { name: 'Other', field: 'other', meta: { interface: 'input' } },
      ],
    });
    const select = wrapper.findAllComponents({ name: 'v-select' })[0];
    const items = select?.props('items') as { field: string | null }[];

    expect(items.map((item) => item.field)).toEqual([null, 'site']);
  });

  it('uses the fields that arrive as a prop, without fetching the collection on its own', () => {
    const wrapper = mountOptions({ fieldsInCollection: [] });
    const select = wrapper.findAllComponents({ name: 'v-select' })[0];
    const items = select?.props('items') as { field: string | null }[];

    expect(items.map((item) => item.field)).toEqual([null]);
  });
});

describe('MapgridOptions — choosing the grid fields', () => {
  it('lists the configured fields in order, so the user sees what the grid shows', () => {
    const wrapper = mountOptions({ fields: ['name', 'city'] });
    const chips = wrapper.findAll('[data-field]').map((node) => node.attributes('data-field'));

    expect(chips).toEqual(['name', 'city']);
  });

  it('appends a field chosen from the collection, keeping the existing ones', async () => {
    const wrapper = mountOptions({ fields: ['name'] });

    wrapper.findComponent({ name: 'v-field-list' }).vm.$emit('add', ['city']);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:fields')?.[0]).toEqual([['name', 'city']]);
  });

  it('does not add a field twice, which would render the same column again', async () => {
    const wrapper = mountOptions({ fields: ['name'] });

    wrapper.findComponent({ name: 'v-field-list' }).vm.$emit('add', ['name']);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:fields')).toBeUndefined();
  });

  it('removes the field whose remove control was used, leaving the rest in order', async () => {
    const wrapper = mountOptions({ fields: ['name', 'city', 'state'] });

    await wrapper.find('[data-field="city"] button').trigger('click');

    expect(wrapper.emitted('update:fields')?.[0]).toEqual([['name', 'state']]);
  });

  it('offers the collection’s fields to v-field-list, disabling the ones already chosen', () => {
    const wrapper = mountOptions({ fields: ['name'] });
    const list = wrapper.findComponent({ name: 'v-field-list' });

    expect(list.props('disabledFields')).toEqual(['name']);
  });
});

describe('MapgridOptions — the numeric camera fields', () => {
  it('converts the input text before emitting, so the preset does not store a string', async () => {
    const wrapper = mountOptions();
    const inputs = wrapper.findAllComponents({ name: 'v-input' });

    inputs[0]?.vm.$emit('update:modelValue', '-42.5');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:mapCenterLng')?.[0]).toEqual([-42.5]);
  });

  it('does not emit for a non-numeric value, instead of storing NaN', async () => {
    const wrapper = mountOptions();
    const inputs = wrapper.findAllComponents({ name: 'v-input' });

    inputs[0]?.vm.$emit('update:modelValue', 'abc');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:mapCenterLng')).toBeUndefined();
  });
});
