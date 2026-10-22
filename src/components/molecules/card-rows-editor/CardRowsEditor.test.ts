// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { CardRowOption } from '../../../services/card-rows/index';
import CardRowsEditor from './CardRowsEditor.vue';

const ROWS: CardRowOption[] = [
  { template: '{{smartphone.brand}} {{smartphone.model}}', label: 'Device' },
  { template: '{{tracked_at}}' },
];

const editor = (rows: CardRowOption[] = ROWS) =>
  mount(CardRowsEditor, {
    props: { collection: 'tracking', modelValue: rows, labelFor: () => 'Tracked at' },
    global: { components: directusComponentStubs },
  });

const written = (wrapper: ReturnType<typeof editor>) =>
  wrapper.emitted('update:modelValue')?.slice(-1)[0]?.[0];

describe('CardRowsEditor', () => {
  it('shows a line per row, the label empty showing the one it would get', () => {
    const wrapper = editor();

    expect(wrapper.findAll('[data-card-row]')).toHaveLength(2);
    const label = wrapper.findAll('[data-card-row-label] input')[1];
    expect(label?.attributes('placeholder')).toBe('Tracked at');
  });

  it('edits a line template and its label', async () => {
    const wrapper = editor();

    await wrapper.findAll('[data-card-row-template]')[1]?.setValue('{{speed_kmh}} km/h');
    expect(written(wrapper)).toEqual([ROWS[0], { template: '{{speed_kmh}} km/h' }]);

    await wrapper.findAll('[data-card-row-label] input')[1]?.setValue('Speed');
    expect(written(wrapper)).toEqual([ROWS[0], { template: '{{tracked_at}}', label: 'Speed' }]);
  });

  it('adds, removes and moves lines', async () => {
    const wrapper = editor();

    await wrapper.get('[data-card-row-add]').trigger('click');
    expect(written(wrapper)).toEqual([...ROWS, { template: '' }]);

    await wrapper.findAll('[data-card-row-down]')[0]?.trigger('click');
    expect(written(wrapper)).toEqual([ROWS[1], ROWS[0]]);

    await wrapper.findAll('[data-card-row-remove]')[0]?.trigger('click');
    expect(written(wrapper)).toEqual([ROWS[1]]);
  });
});
