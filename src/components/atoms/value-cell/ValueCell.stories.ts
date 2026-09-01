import type { Meta, StoryObj } from '@storybook/vue3';
import { generateMockData } from './ValueCell.mock';
import ValueCell from './ValueCell.vue';

const meta: Meta<typeof ValueCell> = {
  title: '01 - Átomos/ValueCell',
  component: ValueCell,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renderiza qualquer valor serializado em texto (string, número, array, coordenadas).',
      },
    },
  },
} satisfies Meta<typeof ValueCell>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
    ...mockData.models,
  },
};

export const Text: Story = {
  args: { value: 'Texto simples' },
};

export const NumberValue: Story = {
  args: { value: 42 },
};

export const ArrayValue: Story = {
  args: { value: ['a', 'b', 'c'] },
};

export const NullValue: Story = {
  args: { value: null },
};
