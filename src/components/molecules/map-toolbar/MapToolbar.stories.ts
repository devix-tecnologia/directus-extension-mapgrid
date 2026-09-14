import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent } from 'storybook/test';
import { generateMockData } from './MapToolbar.mock';
import MapToolbar from './MapToolbar.vue';

const meta: Meta<typeof MapToolbar> = {
  title: '02 - Molecules/MapToolbar',
  component: MapToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button that resets the map view.',
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
    const button = canvasElement.querySelector<HTMLButtonElement>('button');
    expect(button).toBeTruthy();
    if (button) await userEvent.click(button);
  },
};
