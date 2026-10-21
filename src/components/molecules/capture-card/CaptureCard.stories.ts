import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { generateMockData } from './CaptureCard.mock';
import CaptureCard from './CaptureCard.vue';

const meta: Meta<typeof CaptureCard> = {
  title: '02 - Molecules/CaptureCard',
  component: CaptureCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The focused record over the map: its photo, which enlarges on click, its fields and its coordinates.',
      },
    },
  },
} satisfies Meta<typeof CaptureCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

export const WithPhoto: Story = {
  args: { ...mockData.props, onClose: fn() },
  play: async ({ canvasElement }) => {
    const photo = canvasElement.querySelector<HTMLElement>('[data-capture-photo]');
    expect(photo).toBeTruthy();
    await userEvent.click(photo as HTMLElement);
    const enlarged = document.querySelector<HTMLElement>('[data-capture-photo-enlarged]');
    expect(enlarged).toBeTruthy();
    await userEvent.click(enlarged as HTMLElement);
  },
};

export const WithoutPhoto: Story = {
  args: { ...mockData.props, imageUrl: null, onClose: fn() },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-capture-photo]')).toBeNull();
  },
};
