import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn } from 'storybook/test';
import { generateMockData } from './MeasureOverlay.mock';
import MeasureOverlay from './MeasureOverlay.vue';

const meta: Meta<typeof MeasureOverlay> = {
  title: '02 - Molecules/MeasureOverlay',
  component: MeasureOverlay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The measuring tool over the map: the points marked, the legs between them, the last leg and the total distance.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="position: relative; width: 560px; height: 280px; background: #dfe7ef;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof MeasureOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const ThreePoints: Story = {
  args: { ...mockData.props, onClear: fn(), onClose: fn() },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-measure-total]')?.textContent).toContain('km');
  },
};

export const Starting: Story = {
  args: { points: [], lastLeg: null, total: null, onClear: fn(), onClose: fn() },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.measure-panel__hint')).toBeTruthy();
  },
};
