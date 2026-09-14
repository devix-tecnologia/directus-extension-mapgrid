// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks.js';
import { optionsPropsFor } from './MapgridOptions.mock.js';
import MapgridOptions from './MapgridOptions.vue';

const mountOptions = (props: Partial<ReturnType<typeof optionsPropsFor>> = {}) =>
  mount(MapgridOptions, {
    props: { ...optionsPropsFor(), ...props },
    global: { stubs: directusComponentStubs },
  });

describe('MapgridOptions — as seções do painel', () => {
  it('abre uma seção por grupo de opções', () => {
    const wrapper = mountOptions();

    expect(wrapper.findAll('.v-detail').length).toBe(5);
  });

  it('oferece um select por coluna da grade', () => {
    const wrapper = mountOptions();

    expect(wrapper.findAll('.field-group .field').length).toBe(5);
  });
});

describe('MapgridOptions — o select de geolocalização', () => {
  it('só oferece campos de mapa, porque um campo de texto não guarda um ponto', () => {
    const wrapper = mountOptions({
      fieldsInCollection: [
        { name: 'Nome', field: 'nome', meta: null },
        { name: 'Local', field: 'local', meta: { interface: 'map' } },
        { name: 'Outro', field: 'outro', meta: { interface: 'input' } },
      ],
    });
    const select = wrapper.findAllComponents({ name: 'v-select' })[0];
    const items = select?.props('items') as { field: string | null }[];

    expect(items.map((item) => item.field)).toEqual([null, 'local']);
  });

  it('usa os campos vindos por prop, sem buscar a coleção por conta própria', () => {
    const wrapper = mountOptions({ fieldsInCollection: [] });
    const select = wrapper.findAllComponents({ name: 'v-select' })[0];
    const items = select?.props('items') as { field: string | null }[];

    expect(items.map((item) => item.field)).toEqual([null]);
  });
});

describe('MapgridOptions — os campos numéricos da câmera', () => {
  it('converte o texto do input antes de emitir, para o preset não guardar string', async () => {
    const wrapper = mountOptions();
    const inputs = wrapper.findAllComponents({ name: 'v-input' });

    inputs[0]?.vm.$emit('update:modelValue', '-42.5');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:mapCenterLng')?.[0]).toEqual([-42.5]);
  });

  it('não emite para um valor que não é número, em vez de gravar NaN', async () => {
    const wrapper = mountOptions();
    const inputs = wrapper.findAllComponents({ name: 'v-input' });

    inputs[0]?.vm.$emit('update:modelValue', 'abc');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:mapCenterLng')).toBeUndefined();
  });
});
