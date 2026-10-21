// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { FieldPathSelectProps } from './FieldPathSelect.types';
import FieldPathSelect from './FieldPathSelect.vue';

const FIELDS = [
  { field: 'tracked_at', name: 'Tracked at', type: 'timestamp' },
  { field: 'smartphone.icon', name: 'Smartphone → Icon', type: 'uuid' },
];

const picker = (props: Partial<FieldPathSelectProps> = {}) =>
  mount(FieldPathSelect, {
    props: { collection: 'tracking', modelValue: null, fields: FIELDS, ...props },
    global: { components: directusComponentStubs },
  });

const open = async (wrapper: ReturnType<typeof picker>) => {
  await wrapper.get('[data-field-path-activator]').trigger('click');
  return wrapper.getComponent({ name: 'v-field-list' });
};

describe('FieldPathSelect — one field', () => {
  it('shows the chosen path by its name, one relation away included', () => {
    expect(picker({ modelValue: 'smartphone.icon' }).text()).toContain('Smartphone → Icon');
  });

  it('opens the collection field tree and takes the path chosen there', async () => {
    const wrapper = picker();
    const tree = await open(wrapper);

    expect(tree.props('collection')).toBe('tracking');
    tree.vm.$emit('add', ['smartphone.icon']);
    expect(wrapper.emitted('update:modelValue')).toEqual([['smartphone.icon']]);
  });

  it('clears the choice when it may', async () => {
    const wrapper = picker({ modelValue: 'tracked_at', clearable: true });

    await wrapper.get('[data-field-path-clear]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
  });

  it('offers relations to be opened, and of the rest only what it accepts', async () => {
    const wrapper = picker({ accept: (field) => field.type === 'timestamp' });
    const filter = (await open(wrapper)).vm.$attrs['field-filter'] as (field: unknown) => boolean;

    expect(filter({ field: 'tracked_at', type: 'timestamp' })).toBe(true);
    expect(filter({ field: 'speed', type: 'float' })).toBe(false);
    expect(filter({ field: 'smartphone', type: 'integer', meta: { special: ['m2o'] } })).toBe(true);
  });
});

describe('FieldPathSelect — several fields', () => {
  it('adds a path at the end, once', async () => {
    const wrapper = picker({ multiple: true, modelValue: ['tracked_at'] });
    const tree = await open(wrapper);

    tree.vm.$emit('add', ['smartphone.icon']);
    tree.vm.$emit('add', ['tracked_at']);
    expect(wrapper.emitted('update:modelValue')).toEqual([[['tracked_at', 'smartphone.icon']]]);
  });

  it('lists the chosen paths by name and removes one', async () => {
    const wrapper = picker({ multiple: true, modelValue: ['tracked_at', 'smartphone.icon'] });

    expect(wrapper.findAll('[data-field-path]').map((item) => item.text())).toEqual([
      'Tracked at',
      'Smartphone → Icon',
    ]);
    await wrapper.get('[data-field-path="tracked_at"] [data-field-path-remove]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[['smartphone.icon']]]);
  });
});
