import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import DeleteAction from './DeleteAction.vue';

describe('DeleteAction', () => {
  const defaultProps = {
    selectedItems: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
    deleteSelectedItems: vi.fn().mockResolvedValue(undefined),
  };

  it('should render delete button when items selected', () => {
    const wrapper = mount(DeleteAction, {
      props: defaultProps,
      global: {
        stubs: {
          'v-button': {
            template: '<button class="v-button" @click="$emit(\'click\')"><slot /></button>',
            props: ['icon', 'rounded', 'danger', 'secondary'],
          },
          'v-icon': {
            template: '<span class="v-icon" />',
            props: ['name'],
          },
          'v-dialog': {
            template: '<div class="v-dialog"><slot /></div>',
            props: ['modelValue'],
          },
          'v-card': {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot /></div>',
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot /></div>',
          },
          'v-card-actions': {
            template: '<div class="v-card-actions"><slot /></div>',
          },
        },
      },
    });
    expect(wrapper.find('.delete-btn').exists()).toBe(true);
  });

  it('should not render delete button when no items selected', () => {
    const wrapper = mount(DeleteAction, {
      props: {
        ...defaultProps,
        selectedItems: [],
      },
      global: {
        stubs: {
          'v-button': {
            template: '<button class="v-button" @click="$emit(\'click\')"><slot /></button>',
            props: ['icon', 'rounded', 'danger', 'secondary'],
          },
          'v-icon': {
            template: '<span class="v-icon" />',
            props: ['name'],
          },
          'v-dialog': {
            template: '<div class="v-dialog"><slot /></div>',
            props: ['modelValue'],
          },
          'v-card': {
            template: '<div class="v-card"><slot /></div>',
          },
          'v-card-title': {
            template: '<div class="v-card-title"><slot /></div>',
          },
          'v-card-text': {
            template: '<div class="v-card-text"><slot /></div>',
          },
          'v-card-actions': {
            template: '<div class="v-card-actions"><slot /></div>',
          },
        },
      },
    });
    expect(wrapper.find('.delete-btn').exists()).toBe(false);
  });
});
