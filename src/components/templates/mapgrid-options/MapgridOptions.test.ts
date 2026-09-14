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

  it('offers one select per grid column', () => {
    const wrapper = mountOptions();

    expect(wrapper.findAll('.field-group .field').length).toBe(5);
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
