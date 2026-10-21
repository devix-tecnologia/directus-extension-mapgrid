// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CurrentMarkProps } from './CurrentMark.types';
import CurrentMark from './CurrentMark.vue';

const mark = (props: Partial<CurrentMarkProps> = {}) =>
  mount(CurrentMark, { props: { x: 10, y: 20, ...props } });

describe('CurrentMark', () => {
  it('sits at the projected point', () => {
    const style = mark().get('[data-current-point]').attributes('style');

    expect(style).toContain('left: 10px');
    expect(style).toContain('top: 20px');
  });

  it('draws no cone without a direction, rather than a wrong one', () => {
    expect(mark().find('[data-heading-cone]').exists()).toBe(false);
    expect(mark({ screenAngle: null }).find('[data-heading-cone]').exists()).toBe(false);
  });

  it('turns the cone by the screen angle', () => {
    const cone = mark({ screenAngle: 135, heading: 120 }).get('[data-heading-cone]');

    expect(cone.attributes('style')).toContain('rotate(135deg)');
  });

  it('exposes the geographic heading, which is what the record says', () => {
    const wrapper = mark({ screenAngle: 100, heading: 223.4 });

    expect(wrapper.get('[data-current-point]').attributes('data-heading-degrees')).toBe('223');
  });
});
