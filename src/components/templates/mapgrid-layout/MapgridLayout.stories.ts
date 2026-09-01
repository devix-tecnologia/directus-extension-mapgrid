import type { Meta, StoryObj } from '@storybook/vue3';
import { generateMockData } from './MapgridLayout.mock';
import MapgridLayout from './MapgridLayout.vue';

const meta: Meta<typeof MapgridLayout> = {
  title: '04 - Templates/MapgridLayout',
  component: MapgridLayout,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

const layoutFrame = (args: Record<string, unknown>) => ({
  components: { MapgridLayout },
  setup: () => ({ args }),
  template: `
    <div style="width: 1000px; height: 600px;">
      <MapgridLayout v-bind="args" />
    </div>
  `,
});

export const Default: Story = {
  args: mockData.props,
  render: layoutFrame,
};

export const Loading: Story = {
  args: {
    ...mockData.props,
    loading: true,
  },
  render: layoutFrame,
};

export const Empty: Story = {
  args: {
    ...mockData.props,
    items: [],
    selectedItems: [],
  },
  render: layoutFrame,
};
