import type { Meta, StoryObj } from '@storybook/vue3';
import MapGridOptions from './MapGridOptions.vue';

const meta: Meta<typeof MapGridOptions> = {
  title: 'Molecules/MapGridOptions',
  component: MapGridOptions,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    collection: 'test_collection',
    layoutOptions: {},
    fieldsInCollection: [
      { name: 'Name', field: 'name' },
      { name: 'Status', field: 'status' },
      { name: 'Position', field: 'position', meta: { interface: 'map' } },
    ],
  },
};

export const WithGeolocationField: Story = {
  args: {
    collection: 'test_collection',
    layoutOptions: {
      geolocation: 'position',
      title: '{{name}}',
    },
    fieldsInCollection: [
      { name: 'Name', field: 'name' },
      { name: 'Status', field: 'status' },
      { name: 'Position', field: 'position', meta: { interface: 'map' } },
    ],
  },
};
