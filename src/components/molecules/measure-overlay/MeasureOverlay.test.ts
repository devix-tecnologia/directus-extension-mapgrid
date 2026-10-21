// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { generateMockData } from './MeasureOverlay.mock';
import type { MeasureOverlayProps } from './MeasureOverlay.types';
import MeasureOverlay from './MeasureOverlay.vue';

const overlay = (props: Partial<MeasureOverlayProps> = {}) =>
  mount(MeasureOverlay, {
    props: { ...generateMockData().props, ...props },
    global: { components: directusComponentStubs },
  });

describe('MeasureOverlay', () => {
  it('joins the marked points and shows both figures', () => {
    const wrapper = overlay();

    expect(wrapper.findAll('[data-measure-point]')).toHaveLength(3);
    expect(wrapper.findAll('.measure-overlay__leg')).toHaveLength(2);
    expect(wrapper.get('[data-measure-last-leg]').text()).toBe('2.45 km');
    expect(wrapper.get('[data-measure-total]').text()).toBe('23.68 km');
  });

  it('explains what to do before there is a distance', () => {
    const wrapper = overlay({ points: [{ x: 1, y: 1 }], lastLeg: null, total: null });

    expect(wrapper.find('.measure-panel__hint').exists()).toBe(true);
    expect(wrapper.find('[data-measure-total]').exists()).toBe(false);
  });

  it('breaks the line at a point the camera cannot place', () => {
    const wrapper = overlay({ points: [{ x: 1, y: 1 }, null, { x: 5, y: 5 }] });

    expect(wrapper.findAll('.measure-overlay__leg')).toHaveLength(0);
    expect(wrapper.findAll('[data-measure-point]')).toHaveLength(2);
  });

  it('asks to be cleared and to be closed', async () => {
    const wrapper = overlay();

    await wrapper.get('[data-measure-clear] button').trigger('click');
    await wrapper.get('[data-measure-close] button').trigger('click');

    expect(wrapper.emitted('clear')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
