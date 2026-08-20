import type { Meta, StoryObj } from '@storybook/vue3';
import TableComponent from './TableComponent.vue';

const meta: Meta<typeof TableComponent> = {
  title: 'Organisms/TableComponent',
  component: TableComponent,
  tags: ['autodocs'],
  argTypes: {
    collection: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleHeaders = [
  { text: 'Name', value: 'name' },
  { text: 'Status', value: 'status' },
];

const sampleItems = [
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
  { id: 3, name: 'Item 3', status: 'active' },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    headers: sampleHeaders,
    collection: 'test_collection',
    selectedItems: [],
    'onFocus-on-item': () => {},
    'onEdit-item': () => {},
    'onUpdate:selectedItems': () => {},
  },
};

export const WithSelection: Story = {
  args: {
    items: sampleItems,
    headers: sampleHeaders,
    collection: 'test_collection',
    selectedItems: [sampleItems[0]],
    'onFocus-on-item': () => {},
    'onEdit-item': () => {},
    'onUpdate:selectedItems': () => {},
  },
};

export const EmptyState: Story = {
  args: {
    items: [],
    headers: sampleHeaders,
    collection: 'test_collection',
    selectedItems: [],
    'onFocus-on-item': () => {},
    'onEdit-item': () => {},
    'onUpdate:selectedItems': () => {},
  },
};
