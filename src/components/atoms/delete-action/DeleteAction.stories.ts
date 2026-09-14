import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DeleteAction from './DeleteAction.vue';

const meta: Meta<typeof DeleteAction> = {
  title: '01 - Atoms/DeleteAction',
  component: DeleteAction,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Bulk delete button with a confirmation dialog. Only visible when items are selected.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedItems: [
      { id: 1, nome: 'Item 1' },
      { id: 2, nome: 'Item 2' },
    ],
    deleteSelectedItems: async () => {},
  },
};

export const NoItems: Story = {
  args: {
    selectedItems: [],
    deleteSelectedItems: async () => {},
  },
};
