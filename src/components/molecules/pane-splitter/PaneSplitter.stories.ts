import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn } from 'storybook/test';
import { generateMockData } from './PaneSplitter.mock';
import PaneSplitter from './PaneSplitter.vue';

const meta: Meta<typeof PaneSplitter> = {
  title: '02 - Molecules/PaneSplitter',
  component: PaneSplitter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The handle between the map and the grid: drag it, or use the arrow keys, to share the height; a double click goes back to the default.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="display: flex; flex-direction: column; height: 240px; --content-padding: 12px;"><div style="flex: 1; background: #dfe7ef;"></div><story /><div style="flex: 1; background: #f4f6f8;"></div></div>',
    }),
  ],
} satisfies Meta<typeof PaneSplitter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ...generateMockData().props, onPreview: fn(), onCommit: fn(), onReset: fn() },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-pane-splitter]')).toBeTruthy();
  },
};
