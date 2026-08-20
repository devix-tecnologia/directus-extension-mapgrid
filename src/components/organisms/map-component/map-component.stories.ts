import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import MapComponent from './map-component.vue';
import { generateMockData } from './map-component.mock';

const meta: Meta<typeof MapComponent> = {
  title: '03 - Organismos/MapComponent',
  component: MapComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Mapa com markers agrupados (clusters) e controle de reset. Ao receber foco em um item, abre popup e centraliza no marker.',
      },
    },
  },
} satisfies Meta<typeof MapComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
    ...mockData.models,
  },
  render: (args) => ({
    components: { MapComponent },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const container = canvasElement.querySelector('.map-container');
    expect(container).toBeTruthy();
  },
};

export const ZoomDisabled: Story = {
  args: {
    ...mockData.props,
    zoomOnClick: false,
  },
  render: (args) => ({
    components: { MapComponent },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
};

export const Empty: Story = {
  args: {
    items: [],
    geolocation: 'localizacao',
    title: '{{nome}}',
  },
  render: (args) => ({
    components: { MapComponent },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 800px; height: 500px;">
        <MapComponent v-bind="args" />
      </div>
    `,
  }),
};
