import type { Meta, StoryObj } from '@storybook/vue3';
import MapGridLayout from './MapGridLayout.vue';

const meta: Meta<typeof MapGridLayout> = {
  title: 'Templates/MapGridLayout',
  component: MapGridLayout,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  {
    id: 1,
    name: 'Location A',
    position: { coordinates: [-47.9292, -15.7801] },
  },
];

export const Loading: Story = {
  args: {
    items: [],
    loading: true,
    collection: 'test_collection',
    selectedItems: [],
  },
};

export const Empty: Story = {
  args: {
    items: [],
    loading: false,
    collection: 'test_collection',
    selectedItems: [],
  },
};

export const WithData: Story = {
  args: {
    items: sampleItems,
    loading: false,
    collection: 'test_collection',
    title: '{{name}}',
    geolocation: 'position',
    coluna1: 'name',
    selectedItems: [],
  },
};
