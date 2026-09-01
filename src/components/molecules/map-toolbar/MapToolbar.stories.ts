import type { Meta, StoryObj } from '@storybook/vue3';
import MapToolbar from './MapToolbar.vue';

const meta: Meta<typeof MapToolbar> = {
  title: '02 - Moléculas/MapToolbar',
  component: MapToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Botão de reset da visualização do mapa.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { MapToolbar },
    template: `
      <div style="position: relative; width: 600px; height: 400px; background: #eef;">
        <MapToolbar />
      </div>
    `,
  }),
};
