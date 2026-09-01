import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MapToolbar from './MapToolbar.vue';

describe('MapToolbar', () => {
  it('emits reset when button is clicked', async () => {
    const wrapper = mount(MapToolbar, {
      global: {
        components: {
          'v-button': {
            name: 'v-button',
            template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
          },
          'v-icon': {
            name: 'v-icon',
            template: '<span />',
          },
        },
      },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('reset')).toBeTruthy();
  });
});
