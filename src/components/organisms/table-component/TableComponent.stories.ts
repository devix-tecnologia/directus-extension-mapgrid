import type { Meta, StoryObj } from '@storybook/vue3';
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
