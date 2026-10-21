import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { generateMockData } from './CurrentMark.mock';
import CurrentMark from './CurrentMark.vue';

const meta: Meta<typeof CurrentMark> = {
  title: '02 - Molecules/CurrentMark',
  component: CurrentMark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The current record over the map, with a cone pointing where it is heading when the direction is known.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="position: relative; width: 240px; height: 160px; background: #dfe7ef;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof CurrentMark>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const HeadingNorthEast: Story = {
  args: { ...mockData.props },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-heading-cone]')).toBeTruthy();
  },
};

export const WithoutDirection: Story = {
  args: { ...mockData.props, screenAngle: null, heading: null },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-heading-cone]')).toBeNull();
  },
};
