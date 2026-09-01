import type { Meta, StoryObj } from '@storybook/vue3';
import DeleteAction from './DeleteAction.vue';

const meta: Meta<typeof DeleteAction> = {
  title: '01 - Átomos/DeleteAction',
  component: DeleteAction,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Botão de exclusão em lote com diálogo de confirmação. Fica visível apenas quando há itens selecionados.',
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
    deleteSelectedItems: async () => {
      console.log('Delete executed');
    },
  },
};

export const NoItems: Story = {
  args: {
    selectedItems: [],
    deleteSelectedItems: async () => {
      console.log('Delete executed');
    },
  },
};
