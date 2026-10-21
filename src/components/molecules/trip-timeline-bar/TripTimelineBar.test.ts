// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { generateMockData } from './TripTimelineBar.mock';
import type { TripTimelineBarProps } from './TripTimelineBar.types';
import TripTimelineBar from './TripTimelineBar.vue';

const bar = (props: Partial<TripTimelineBarProps> = {}) => {
  const wrapper = mount(TripTimelineBar, { props: { ...generateMockData().props, ...props } });
  const track = wrapper.get('[role="slider"]').element as HTMLElement;
  track.getBoundingClientRect = () =>
    ({ left: 100, width: 400, top: 0, height: 28, right: 500, bottom: 28 }) as DOMRect;
  return wrapper;
};

describe('TripTimelineBar', () => {
  it('shows both ends and a tick for each loaded record', () => {
    const wrapper = bar();

    expect(wrapper.get('[data-timeline-start]').text()).toBe('27/05/2026 14:23');
    expect(wrapper.get('[data-timeline-end]').text()).toBe('23/06/2026 17:28');
    expect(wrapper.findAll('[data-timeline-tick]')).toHaveLength(8);
  });

  it('places the marker at the current record', () => {
    const marker = bar().get('[data-timeline-marker]');

    expect(marker.attributes('style')).toContain('left: 22%');
    expect(marker.text()).toBe('05/06/2026 16:12');
  });

  it('has no marker without a current record', () => {
    expect(bar({ marker: null }).find('[data-timeline-marker]').exists()).toBe(false);
  });

  it('seeks only on release, where the pointer let go', async () => {
    const wrapper = bar();
    const track = wrapper.get('[role="slider"]');

    await track.trigger('pointerdown', { clientX: 150, pointerId: 1 });
    await track.trigger('pointermove', { clientX: 250, pointerId: 1 });
    expect(wrapper.emitted('seek')).toBeUndefined();
    expect(wrapper.get('[data-timeline-marker]').attributes('data-position')).toBe('37.50');

    await track.trigger('pointerup', { clientX: 300, pointerId: 1 });
    expect(wrapper.emitted('seek')).toEqual([[50]]);
  });

  it('does not seek while disabled', async () => {
    const wrapper = bar({ disabled: true });
    const track = wrapper.get('[role="slider"]');

    await track.trigger('pointerdown', { clientX: 150, pointerId: 1 });
    await track.trigger('pointerup', { clientX: 300, pointerId: 1 });

    expect(wrapper.emitted('seek')).toBeUndefined();
  });

  it('nudges with the arrow keys', async () => {
    const wrapper = bar();

    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' });

    expect(wrapper.emitted('seek')).toEqual([[23]]);
  });
});
