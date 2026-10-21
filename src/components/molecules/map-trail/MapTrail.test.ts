// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { generateMockData } from './MapTrail.mock';
import MapTrail from './MapTrail.vue';

describe('MapTrail', () => {
  it('draws the three layers of every leg', () => {
    const { segments } = generateMockData().props;
    const wrapper = mount(MapTrail, { props: { segments } });

    expect(wrapper.get('[data-trail]').attributes('data-trail-segments')).toBe('3');
    expect(wrapper.findAll('.map-trail__halo')).toHaveLength(3);
    expect(wrapper.findAll('.map-trail__line')).toHaveLength(3);
    expect(wrapper.findAll('.map-trail__arrows')).toHaveLength(3);
  });

  it('repeats the arrow along each leg', () => {
    const { segments } = generateMockData().props;
    const arrows = mount(MapTrail, { props: { segments } }).get('.map-trail__arrows');

    expect(arrows.attributes('marker-mid')).toMatch(/^url\(#mapgrid-trail-arrow-/);
  });

  it('fades the older legs', () => {
    const { segments } = generateMockData().props;
    const groups = mount(MapTrail, { props: { segments } }).findAll('.map-trail__segment');

    expect(groups[2]?.attributes('style')).toContain('opacity: 1');
    expect(groups[0]?.attributes('style')).not.toContain('opacity: 1;');
  });

  it('draws nothing without legs', () => {
    const wrapper = mount(MapTrail, { props: { segments: [] } });

    expect(wrapper.findAll('.map-trail__segment')).toHaveLength(0);
  });
});
