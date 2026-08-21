import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import MapgridLayout from './MapgridLayout.vue';
import { generateMockData } from './MapgridLayout.mock';

const meta: Meta<typeof MapgridLayout> = {
  title: '04 - Templates/MapgridLayout',
  component: MapgridLayout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Template do layout MapGrid: compõe o mapa e a grade, sincronizando a seleção entre os dois.',
      },
    },
  },
} satisfies Meta<typeof MapgridLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
    ...mockData.models,
  },
  render: (args) => ({
    components: { MapgridLayout },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 1000px; height: 600px;">
        <MapgridLayout v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const container = canvasElement.querySelector('.mapgrid-container');
    expect(container).toBeTruthy();
  },
};

export const Loading: Story = {
  args: {
    ...mockData.props,
    loading: true,
  },
  render: (args) => ({
    components: { MapgridLayout },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 1000px; height: 600px;">
        <MapgridLayout v-bind="args" />
      </div>
    `,
  }),
};

export const Empty: Story = {
  args: {
    items: [],
    collection: 'mapgrid',
  },
  render: (args) => ({
    components: { MapgridLayout },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 1000px; height: 600px;">
        <MapgridLayout v-bind="args" />
      </div>
    `,
  }),
};
