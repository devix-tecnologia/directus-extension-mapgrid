// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { CatalogField } from '../../../services/field-catalog/index';
import { FieldTree } from '../../../services/field-tree/index';
import type { FieldPathSelectProps } from './FieldPathSelect.types';
import FieldPathSelect from './FieldPathSelect.vue';

const SCHEMA: Record<string, CatalogField[]> = {
  tracking: [
    { field: 'tracked_at', name: 'Tracked at', type: 'timestamp' },
    { field: 'smartphone', name: 'Smartphone', type: 'integer', meta: { special: ['m2o'] } },
  ],
  smartphones: [
    { field: 'brand', name: 'Brand', type: 'string' },
    { field: 'icon', name: 'Icon', type: 'uuid', meta: { special: ['file'] } },
  ],
};
const tree = new FieldTree({
  fieldsOf: (collection) => SCHEMA[collection] ?? [],
  relatedCollectionOf: (collection, field) =>
    collection === 'tracking' && field === 'smartphone' ? 'smartphones' : null,
});
const isFile = (field: CatalogField) => field.type === 'uuid';
const nodesOf: FieldPathSelectProps['nodesOf'] = (collection, parent) =>
  tree.children(collection, { accept: isFile }, parent);

const NAMES = [
  { field: 'tracked_at', name: 'Tracked at', type: 'timestamp' },
  { field: 'smartphone.icon', name: 'Smartphone → Icon', type: 'uuid' },
];

const picker = (props: Partial<FieldPathSelectProps> = {}) =>
  mount(FieldPathSelect, {
    props: { collection: 'tracking', modelValue: null, nodesOf, fields: NAMES, ...props },
    global: { components: directusComponentStubs },
  });

const open = (wrapper: ReturnType<typeof picker>) =>
  wrapper.get('[data-field-path-activator]').trigger('click');

describe('FieldPathSelect — one field', () => {
  it('shows the chosen path by its name, one relation away included', () => {
    expect(picker({ modelValue: 'smartphone.icon' }).text()).toContain('Smartphone → Icon');
  });

  it('shows only what leads to the kind asked for', async () => {
    const wrapper = picker();
    await open(wrapper);

    expect(wrapper.findAll('[data-field-tree-node]').map((row) => row.text())).toEqual([
      'Smartphone',
    ]);
  });

  it('opens a relation on click, and chooses the field inside', async () => {
    const wrapper = picker();
    await open(wrapper);

    await wrapper.get('[data-field-tree-node="smartphone"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper.get('[data-field-tree-node="smartphone.icon"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['smartphone.icon']]);
  });

  it('clears the choice when it may', async () => {
    const wrapper = picker({ modelValue: 'tracked_at', clearable: true });

    await wrapper.get('[data-field-path-clear]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
  });
});
