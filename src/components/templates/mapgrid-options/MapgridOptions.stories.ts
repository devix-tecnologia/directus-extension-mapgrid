import type { Meta, StoryObj } from '@storybook/vue3';
import { generateMockData } from './MapgridOptions.mock';
import MapgridOptions from './MapgridOptions.vue';

const meta: Meta<typeof MapgridOptions> = {
  title: '04 - Templates/MapgridOptions',
  component: MapgridOptions,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
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
