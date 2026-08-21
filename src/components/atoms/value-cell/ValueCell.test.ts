import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ValueCell from './ValueCell.vue';

describe('ValueCell', () => {
  it('renders a serialized string value', () => {
    const wrapper = mount(ValueCell, { props: { value: 'olá' } });
    expect(wrapper.text()).toBe('olá');
  });

  it('renders a number', () => {
    const wrapper = mount(ValueCell, { props: { value: 42 } });
    expect(wrapper.text()).toBe('42');
  });

  it('renders empty for null', () => {
    const wrapper = mount(ValueCell, { props: { value: null } });
    expect(wrapper.text()).toBe('');
  });

  it('renders array joined by comma', () => {
    const wrapper = mount(ValueCell, { props: { value: ['a', 'b'] } });
    expect(wrapper.text()).toBe('a, b');
  });
});
