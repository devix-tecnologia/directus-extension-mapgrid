import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent } from 'storybook/test';
import { expect } from 'storybook/test';
import MapToolbar from './map-toolbar.vue';
import { generateMockData } from './map-toolbar.mock';

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
} satisfies Meta<typeof MapToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const Default: Story = {
  args: {
    ...mockData.props,
    ...mockData.models,
  },
  render: () => ({
    components: { MapToolbar },
    template: `
      <div style="position: relative; width: 600px; height: 400px; background: #eef;">
        <MapToolbar />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button');
    expect(button).toBeTruthy();
    await userEvent.click(button as HTMLButtonElement);
  },
};
