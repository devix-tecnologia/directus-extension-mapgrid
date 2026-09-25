// @vitest-environment happy-dom
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Directive } from 'vue';
import { directusComponentStubs, tooltipDirective } from '../../../mocks/directus-mocks';
import type { MapToolbarProps } from './MapToolbar.types';
import MapToolbar from './MapToolbar.vue';

const toolbar = (props: Partial<MapToolbarProps> = {}) =>
  mount(MapToolbar, {
    props,
    global: {
      components: directusComponentStubs,
      directives: { tooltip: tooltipDirective },
    },
  });

const control = (wrapper: VueWrapper, name: string) =>
  wrapper.get(`[data-control="${name}"] button`);

const iconOf = (wrapper: VueWrapper, name: string) =>
  wrapper.get(`[data-control="${name}"] .v-icon`).attributes('data-name');

describe('MapToolbar — the step controls', () => {
  it.each(['first', 'previous', 'next', 'last'] as const)('emits %s when clicked', async (step) => {
    const wrapper = toolbar();

    await control(wrapper, step).trigger('click');

    expect(wrapper.emitted(step)).toHaveLength(1);
  });

  it('disables going back at the first record of the query', () => {
    const wrapper = toolbar({ atStart: true });

    expect(control(wrapper, 'first').attributes('disabled')).toBeDefined();
    expect(control(wrapper, 'previous').attributes('disabled')).toBeDefined();
    expect(control(wrapper, 'next').attributes('disabled')).toBeUndefined();
  });

  it('disables going forward at the last record of the query', () => {
    const wrapper = toolbar({ atEnd: true });

    expect(control(wrapper, 'next').attributes('disabled')).toBeDefined();
    expect(control(wrapper, 'last').attributes('disabled')).toBeDefined();
    expect(control(wrapper, 'previous').attributes('disabled')).toBeUndefined();
  });

  it('waits for the page instead of stepping onto a list that is still the old one', () => {
    const wrapper = toolbar({ loading: true });

    for (const step of ['first', 'previous', 'next', 'last'] as const) {
      expect(control(wrapper, step).attributes('disabled')).toBeDefined();
    }
  });
});

describe('MapToolbar — playback', () => {
  it('asks to play while it is stopped', async () => {
    const wrapper = toolbar({ playing: false });

    expect(iconOf(wrapper, 'playback')).toBe('play_arrow');
    await control(wrapper, 'playback').trigger('click');

    expect(wrapper.emitted('play')).toHaveLength(1);
    expect(wrapper.emitted('stop')).toBeUndefined();
  });

  it('asks to stop while it is playing', async () => {
    const wrapper = toolbar({ playing: true });

    expect(iconOf(wrapper, 'playback')).toBe('stop');
    await control(wrapper, 'playback').trigger('click');

    expect(wrapper.emitted('stop')).toHaveLength(1);
    expect(wrapper.emitted('play')).toBeUndefined();
  });

  it('cannot start a playback that has nowhere to go', () => {
    const wrapper = toolbar({ atEnd: true, playing: false });

    expect(control(wrapper, 'playback').attributes('disabled')).toBeDefined();
  });

  it('can always be stopped, even standing on the last record', () => {
    const wrapper = toolbar({ atEnd: true, playing: true });

    expect(control(wrapper, 'playback').attributes('disabled')).toBeUndefined();
  });
});

describe('MapToolbar — the camera tracking control', () => {
  it('shows the icon of each state', () => {
    expect(iconOf(toolbar({ tracking: 'off' }), 'tracking')).toBe('gps_off');
    expect(iconOf(toolbar({ tracking: 'follow' }), 'tracking')).toBe('gps_not_fixed');
    expect(iconOf(toolbar({ tracking: 'center' }), 'tracking')).toBe('gps_fixed');
  });

  it('cycles to the next state on click', async () => {
    const wrapper = toolbar({ tracking: 'follow' });

    await control(wrapper, 'tracking').trigger('click');

    expect(wrapper.emitted('update:tracking')).toEqual([['center']]);
  });

  it('follows when nothing was persisted', async () => {
    const wrapper = toolbar();

    expect(iconOf(wrapper, 'tracking')).toBe('gps_not_fixed');
    await control(wrapper, 'tracking').trigger('click');

    expect(wrapper.emitted('update:tracking')).toEqual([['center']]);
  });
});

describe('MapToolbar — resetting the view', () => {
  it('still emits reset, which is what the toolbar was born for', async () => {
    const wrapper = toolbar();

    await control(wrapper, 'reset').trigger('click');

    expect(wrapper.emitted('reset')).toHaveLength(1);
  });
});

/** The tooltip is where the keyboard help shows up, and the shared stub keeps no text. */
const tooltips = new Map<Element, string>();
const recordingTooltip: Directive = {
  mounted(element, binding): void {
    tooltips.set(element, String(binding.value));
  },
  updated(element, binding): void {
    tooltips.set(element, String(binding.value));
  },
};

const tooltipOf = (wrapper: VueWrapper, name: string): string =>
  tooltips.get(wrapper.get(`[data-control="${name}"]`).element) ?? '';

const toolbarWithTooltips = (props: Partial<MapToolbarProps> = {}) =>
  mount(MapToolbar, {
    props,
    global: { components: directusComponentStubs, directives: { tooltip: recordingTooltip } },
  });

describe('MapToolbar — the keyboard help', () => {
  it('tells which key does each step, next to what the control does', () => {
    const wrapper = toolbarWithTooltips();

    expect(tooltipOf(wrapper, 'first')).toContain('Home');
    expect(tooltipOf(wrapper, 'previous')).toContain('←');
    expect(tooltipOf(wrapper, 'next')).toContain('→');
    expect(tooltipOf(wrapper, 'last')).toContain('End');
    expect(tooltipOf(wrapper, 'playback')).toContain('Space');
  });

  it('keeps the label of the control, which the key only completes', () => {
    const wrapper = toolbarWithTooltips();

    expect(tooltipOf(wrapper, 'first')).toContain('First record');
    expect(tooltipOf(wrapper, 'playback')).toContain('Play through the records');
  });

  it('says nothing about a key for the controls that have none', () => {
    const wrapper = toolbarWithTooltips();

    expect(tooltipOf(wrapper, 'tracking')).toBe('Camera: follow');
    expect(tooltipOf(wrapper, 'reset')).toBe('Reset view');
  });
});
