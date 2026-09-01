import type { Meta, StoryObj } from '@storybook/vue3';
import MapComponent from './MapComponent.vue';

const meta: Meta<typeof MapComponent> = {
  title: '03 - Organismos/MapComponent',
  component: MapComponent,
  tags: ['autodocs'],
  argTypes: {
    geolocation: { control: 'text' },
    title: { control: 'text' },
    zoomOnClick: { control: 'boolean' },
    centerLng: { control: 'number' },
    centerLat: { control: 'number' },
    initialZoom: { control: 'number', min: 1, max: 20 },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  {
    id: 1,
    name: 'Location A',
    position: { coordinates: [-47.9292, -15.7801] },
  },
  {
    id: 2,
    name: 'Location B',
    position: { coordinates: [-43.9386, -19.8157] },
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    geolocation: 'position',
    title: '{{name}}',
    zoomOnClick: false,
    centerLng: -47.9292,
    centerLat: -15.7801,
    initialZoom: 4,
  },
  render: (args) => ({
    components: { MapComponent },
    setup: () => ({ args }),
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
};

export const EmptyState: Story = {
  args: {
    items: [],
    geolocation: 'position',
    title: '{{name}}',
    zoomOnClick: false,
    centerLng: -47.9292,
    centerLat: -15.7801,
    initialZoom: 4,
  },
  render: (args) => ({
    components: { MapComponent },
    setup: () => ({ args }),
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
};

export const WithZoomOnClick: Story = {
  args: {
    items: sampleItems,
    geolocation: 'position',
    title: '{{name}}',
    zoomOnClick: true,
    centerLng: -47.9292,
    centerLat: -15.7801,
    initialZoom: 4,
  },
  render: (args) => ({
    components: { MapComponent },
    setup: () => ({ args }),
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
};
