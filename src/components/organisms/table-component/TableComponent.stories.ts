import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent } from 'storybook/test';
import { generateMockData } from './TableComponent.mock';
import TableComponent from './TableComponent.vue';

const meta: Meta<typeof TableComponent> = {
  title: '03 - Organismos/TableComponent',
  component: TableComponent,
  tags: ['autodocs'],
  argTypes: {
    collection: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

const tableFrame = (args: Record<string, unknown>) => ({
  components: { TableComponent },
  setup: () => ({ args }),
  template: `
    <div style="width: 800px; height: 400px;">
      <TableComponent v-bind="args" />
    </div>
  `,
});

export const Default: Story = {
  args: {
    ...mockData.props,
    selectedItems: [],
  },
  render: tableFrame,
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll<HTMLTableRowElement>('tbody tr');
    const firstRow = rows[0];
    expect(firstRow).toBeTruthy();
    if (firstRow) await userEvent.click(firstRow);
  },
};

export const WithSelection: Story = {
  args: {
    ...mockData.props,
    selectedItems: [mockData.props.items[0]],
  },
  render: tableFrame,
};

export const EmptyState: Story = {
  args: {
    items: [],
    headers: mockData.props.headers,
    collection: mockData.props.collection,
    selectedItems: [],
  },
  render: tableFrame,
};

export const EditDisabled: Story = {
  name: 'Permissão: sem edição',
  args: {
    ...mockData.props,
    canEdit: false,
  },
  render: tableFrame,
};

export const DeleteDisabled: Story = {
  name: 'Permissão: sem deleção',
  args: {
    ...mockData.props,
    canDelete: false,
  },
  render: tableFrame,
};

export const EditDeleteDisabled: Story = {
  name: 'Permissão: sem edição e sem deleção',
  args: {
    ...mockData.props,
    canEdit: false,
    canDelete: false,
  },
  render: tableFrame,
};
