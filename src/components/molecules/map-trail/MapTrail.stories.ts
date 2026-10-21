import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { generateMockData } from './MapTrail.mock';
import MapTrail from './MapTrail.vue';

const meta: Meta<typeof MapTrail> = {
  title: '02 - Molecules/MapTrail',
  component: MapTrail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The trail behind the current record: the visited records joined in order, with arrows repeated along it and the older legs fading.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="position: relative; width: 320px; height: 180px; background: #dfe7ef;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof MapTrail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLegs: Story = {
  args: { ...generateMockData().props },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelectorAll('.map-trail__segment')).toHaveLength(3);
  },
};
