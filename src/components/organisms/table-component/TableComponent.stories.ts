import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent } from 'storybook/test';
import { expect } from 'storybook/test';
import TableComponent from './TableComponent.vue';
import { generateMockData } from './TableComponent.mock';

const meta: Meta<typeof TableComponent> = {
  title: '03 - Organismos/TableComponent',
  component: TableComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Grade (grid) de itens da coleção com seleção de linha e ação de edição.',
      },
    },
  },
} satisfies Meta<typeof TableComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
    ...mockData.models,
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 800px; height: 400px;">
        <TableComponent v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    await userEvent.click(rows[0] as HTMLTableRowElement);
  },
};

export const Empty: Story = {
  args: {
    items: [],
    headers: mockData.props.headers,
    collection: 'mapgrid',
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 800px; height: 400px;">
        <TableComponent v-bind="args" />
      </div>
    `,
  }),
};
