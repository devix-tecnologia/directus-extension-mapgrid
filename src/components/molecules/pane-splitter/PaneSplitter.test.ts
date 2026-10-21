// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import PaneSplitter from './PaneSplitter.vue';

/** Inside a container 800px tall from y=100, which is what the handle measures against. */
const splitter = (share = 0.6) => {
  const Host = defineComponent({
    setup: () => () => h('div', { class: 'host' }, [h(PaneSplitter, { share })]),
  });
  const wrapper = mount(Host, { attachTo: document.body });
  const host = wrapper.get('.host').element as HTMLElement;
  host.getBoundingClientRect = () =>
    ({ top: 100, height: 800, left: 0, width: 600, right: 600, bottom: 900 }) as DOMRect;
  return {
    wrapper,
    handle: wrapper.get('[data-pane-splitter]'),
    inner: wrapper.findComponent(PaneSplitter),
  };
};

describe('PaneSplitter', () => {
  it('previews while dragging and commits where it was let go', async () => {
    const { handle, inner } = splitter();

    await handle.trigger('pointerdown', { clientY: 580, pointerId: 1 });
    await handle.trigger('pointermove', { clientY: 500, pointerId: 1 });
    expect(inner.emitted('preview')).toEqual([[0.5]]);
    expect(inner.emitted('commit')).toBeUndefined();

    await handle.trigger('pointerup', { clientY: 420, pointerId: 1 });
    expect(inner.emitted('commit')).toEqual([[0.4]]);
  });

  it('stores nothing for a click that did not travel, as the clicks of a double click', async () => {
    const { handle, inner } = splitter();

    await handle.trigger('pointerdown', { clientY: 580, pointerId: 1 });
    await handle.trigger('pointerup', { clientY: 581, pointerId: 1 });

    expect(inner.emitted('commit')).toBeUndefined();
  });

  it('moves with the arrow keys, in steps', async () => {
    const { handle, inner } = splitter(0.6);

    await handle.trigger('keydown', { key: 'ArrowUp' });
    await handle.trigger('keydown', { key: 'ArrowDown' });

    expect(inner.emitted('commit')).toEqual([[0.55], [0.65]]);
  });

  it('asks for the default on a double click', async () => {
    const { handle, inner } = splitter();

    await handle.trigger('dblclick');

    expect(inner.emitted('reset')).toHaveLength(1);
  });

  it('says where it stands, for a screen reader', () => {
    expect(splitter(0.6).handle.attributes('aria-valuenow')).toBe('60');
  });
});
