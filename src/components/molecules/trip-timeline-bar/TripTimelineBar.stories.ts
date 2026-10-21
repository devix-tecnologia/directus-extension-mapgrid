import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn } from 'storybook/test';
import { generateMockData } from './TripTimelineBar.mock';
import TripTimelineBar from './TripTimelineBar.vue';

const meta: Meta<typeof TripTimelineBar> = {
  title: '02 - Molecules/TripTimelineBar',
  component: TripTimelineBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The trip on a time axis: both ends, a tick per loaded record and the current one. Releasing the marker jumps to that moment.',
      },
    },
  },
  decorators: [
    () => ({ template: '<div style="width: 640px; padding-top: 24px;"><story /></div>' }),
  ],
} satisfies Meta<typeof TripTimelineBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const MidTrip: Story = {
  args: { ...mockData.props, onSeek: fn() },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-timeline-marker]')).toBeTruthy();
  },
};

export const BeforeAnyRecord: Story = {
  args: { ...mockData.props, marker: null, markerLabel: undefined, onSeek: fn() },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-timeline-marker]')).toBeNull();
  },
};
