import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { mockGeoItems } from '../../../mocks/mappable-mocks.js';
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

export const Default: Story = {
  args: {
    items: mockGeoItems,
    geolocation: 'localizacao',
    title: '{{nome}}',
    zoomOnClick: false,
    centerLng: -46.6333,
    centerLat: -23.5505,
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
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.map-container')).toBeTruthy();
    });
  },
};

export const EmptyState: Story = {
  args: {
    items: [],
    geolocation: 'localizacao',
    title: '{{nome}}',
    zoomOnClick: false,
    centerLng: -46.6333,
    centerLat: -23.5505,
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
    items: mockGeoItems,
    geolocation: 'localizacao',
    title: '{{nome}}',
    zoomOnClick: true,
    centerLng: -46.6333,
    centerLat: -23.5505,
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
