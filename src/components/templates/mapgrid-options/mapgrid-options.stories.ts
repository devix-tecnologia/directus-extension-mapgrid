import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MapgridOptions from './mapgrid-options.vue';
import { generateMockData } from './mapgrid-options.mock';

const meta: Meta<typeof MapgridOptions> = {
  title: '04 - Templates/MapgridOptions',
  component: MapgridOptions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Painel de opções do layout MapGrid (popup, geolocation, zoom e colunas).',
      },
    },
  },
} satisfies Meta<typeof MapgridOptions>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
    ...mockData.models,
  },
  render: (args) => ({
    components: { MapgridOptions },
    setup() {
      return { args };
    },
    template: `
      <div style="width: 400px; padding: 16px; background: #fff;">
        <MapgridOptions v-bind="args" />
      </div>
    `,
  }),
};
