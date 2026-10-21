// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { generateMockData } from './TourBalloon.mock';
import type { TourBalloonProps } from './TourBalloon.types';
import TourBalloon from './TourBalloon.vue';

const balloon = (props: Partial<TourBalloonProps> = {}) =>
  mount(TourBalloon, {
    props: { ...generateMockData().props, ...props },
    global: { components: directusComponentStubs },
    attachTo: document.body,
  });

const find = (selector: string): HTMLElement | null => document.querySelector(selector);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('TourBalloon', () => {
  it('says which feature, and where in the tour it is', () => {
    balloon();

    expect(find('[data-tour-balloon]')?.getAttribute('data-tour-step')).toBe('measure');
    expect(find('[data-tour-title]')?.textContent).toBe('Measure distances');
    expect(find('[data-tour-count]')?.textContent?.trim()).toBe('3 of 9');
  });

  it('lights the feature it points at', () => {
    balloon();

    const style = find('[data-tour-spotlight]')?.getAttribute('style') ?? '';
    expect(style).toContain('top: 114px');
    expect(style).toContain('width: 48px');
  });

  it('goes forward, back and away', async () => {
    const wrapper = balloon();

    find('[data-tour-next] button')?.click();
    find('[data-tour-previous] button')?.click();
    find('[data-tour-close]')?.click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('next')).toHaveLength(1);
    expect(wrapper.emitted('previous')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('has no way back on the first step, and finishes on the last', () => {
    balloon({ number: 1, total: 1 });

    expect(find('[data-tour-previous]')).toBeNull();
    expect(find('[data-tour-next]')?.textContent?.trim()).toBe('Done');
  });

  it('draws nothing until the feature is on the page', () => {
    balloon({ anchor: null });

    expect(find('[data-tour-balloon]')).toBeNull();
    expect(find('[data-tour-spotlight]')).toBeNull();
  });
});
