// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import { generateMockData } from './CaptureCard.mock';
import type { CaptureCardProps } from './CaptureCard.types';
import CaptureCard from './CaptureCard.vue';

const card = (props: Partial<CaptureCardProps> = {}) =>
  mount(CaptureCard, {
    props: { ...generateMockData().props, ...props },
    global: { components: directusComponentStubs },
    attachTo: document.body,
  });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CaptureCard', () => {
  it('names the record and lists its fields, the coordinates last', () => {
    const wrapper = card();

    expect(wrapper.get('[data-capture-title]').text()).toBe('RQP4C58');
    expect(wrapper.get('[data-capture-field="equipment_label"]').text()).toBe('VTR-1203');
    expect(wrapper.get('[data-capture-field="coordinates"]').text()).toBe('-20.33180, -40.28480');
  });

  it('enlarges the photo on click, and shrinks it on the next', async () => {
    const wrapper = card();

    await wrapper.get('[data-capture-photo]').trigger('click');
    const enlarged = document.querySelector<HTMLElement>('[data-capture-photo-enlarged]');
    expect(enlarged?.querySelector('img')?.getAttribute('src')).toBe(
      generateMockData().props.imageUrl
    );

    enlarged?.click();
    await wrapper.vm.$nextTick();
    expect(document.querySelector('[data-capture-photo-enlarged]')).toBeNull();
  });

  it('shrinks the photo on Escape', async () => {
    const wrapper = card();
    await wrapper.get('[data-capture-photo]').trigger('click');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(document.querySelector('[data-capture-photo-enlarged]')).toBeNull();
  });

  it('has no photo area without a photo', () => {
    expect(card({ imageUrl: null }).find('[data-capture-photo]').exists()).toBe(false);
  });

  it('asks to be closed', async () => {
    const wrapper = card();

    await wrapper.get('[data-capture-close]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
