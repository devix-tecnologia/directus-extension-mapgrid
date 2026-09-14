import type { Meta, StoryObj } from '@storybook/vue3-vite';
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

const optionsFrame = (args: Record<string, unknown>) => ({
  components: { MapgridOptions },
  setup: () => ({ args }),
  template: `
    <div style="width: 380px; padding: 16px; background: var(--theme--background-normal, #fff);">
      <MapgridOptions v-bind="args" />
    </div>
  `,
});

export const Default: Story = {
  args: {
    ...mockData.props,
  },
  render: optionsFrame,
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
  render: optionsFrame,
};
