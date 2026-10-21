import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn } from 'storybook/test';
import { generateMockData } from './TourBalloon.mock';
import TourBalloon from './TourBalloon.vue';

const meta: Meta<typeof TourBalloon> = {
  title: '02 - Molecules/TourBalloon',
  component: TourBalloon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A balloon of the MapGrid tour: it lights the feature it presents, dims the rest, and walks forward and back.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="position: relative; height: 420px;"><button style="position: fixed; top: 120px; left: 260px; width: 36px; height: 36px;">📏</button><story /></div>',
    }),
  ],
} satisfies Meta<typeof TourBalloon>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const MidTour: Story = {
  args: { ...mockData.props, onNext: fn(), onPrevious: fn(), onClose: fn() },
  play: async () => {
    expect(document.querySelector('[data-tour-balloon]')).toBeTruthy();
  },
};

export const LastStep: Story = {
  args: { ...mockData.props, number: 9, total: 9, onNext: fn(), onPrevious: fn(), onClose: fn() },
  play: async () => {
    expect(document.querySelector('[data-tour-next]')?.textContent?.trim()).toBe('Done');
  },
};
