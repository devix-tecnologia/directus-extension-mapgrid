import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { generateMockData } from './MapToolbar.mock';
import MapToolbar from './MapToolbar.vue';

const meta: Meta<typeof MapToolbar> = {
  title: '02 - Molecules/MapToolbar',
  component: MapToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The MapGrid controls over the Directus map: walking the records, playback, camera tracking and resetting the view.',
      },
    },
  },
  decorators: [
    () => ({
      template:
        '<div style="position: relative; width: 600px; height: 160px; background: #eef;"><div style="position: absolute; top: 8px; right: 8px;"><story /></div></div>',
    }),
  ],
} satisfies Meta<typeof MapToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = generateMockData();

const control = (canvasElement: HTMLElement, name: string): HTMLButtonElement => {
  const button = canvasElement.querySelector<HTMLButtonElement>(`[data-control="${name}"] button`);
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
};

/**
 * The spies live here, and not in `args`, because Storybook derives the story's
 * arg types from the component's props alone: `defineEmits<MapToolbarEmits>()`
 * does not reach them, so `args.onNext` has no type. They are cleared at the
 * start of each `play` — Storybook replays it on every re-render.
 */
const spies = {
  onFirst: fn(),
  onPrevious: fn(),
  onNext: fn(),
  onLast: fn(),
  onPlay: fn(),
  onStop: fn(),
  onReset: fn(),
  'onUpdate:tracking': fn(),
};

const clearSpies = (): void => {
  for (const spy of Object.values(spies)) spy.mockClear();
};

export const Default: Story = {
  args: { ...mockData.props, ...mockData.models, ...spies },
  play: async ({ canvasElement }) => {
    clearSpies();

    for (const step of ['first', 'previous', 'next', 'last'] as const) {
      await userEvent.click(control(canvasElement, step));
    }

    expect(spies.onFirst).toHaveBeenCalledOnce();
    expect(spies.onPrevious).toHaveBeenCalledOnce();
    expect(spies.onNext).toHaveBeenCalledOnce();
    expect(spies.onLast).toHaveBeenCalledOnce();

    await userEvent.click(control(canvasElement, 'playback'));
    expect(spies.onPlay).toHaveBeenCalledOnce();
    expect(spies.onStop).not.toHaveBeenCalled();

    await userEvent.click(control(canvasElement, 'reset'));
    expect(spies.onReset).toHaveBeenCalledOnce();
  },
};

export const AtTheFirstRecord: Story = {
  args: { ...mockData.props, ...spies, atStart: true },
  play: async ({ canvasElement }) => {
    expect(control(canvasElement, 'first').disabled).toBe(true);
    expect(control(canvasElement, 'previous').disabled).toBe(true);
    expect(control(canvasElement, 'next').disabled).toBe(false);
    expect(control(canvasElement, 'last').disabled).toBe(false);
  },
};

export const AtTheLastRecord: Story = {
  args: { ...mockData.props, ...spies, atEnd: true },
  play: async ({ canvasElement }) => {
    expect(control(canvasElement, 'next').disabled).toBe(true);
    expect(control(canvasElement, 'last').disabled).toBe(true);
    expect(control(canvasElement, 'playback').disabled).toBe(true);
    expect(control(canvasElement, 'previous').disabled).toBe(false);
  },
};

export const Playing: Story = {
  args: { ...mockData.props, ...spies, playing: true },
  play: async ({ canvasElement }) => {
    clearSpies();

    await userEvent.click(control(canvasElement, 'playback'));

    expect(spies.onStop).toHaveBeenCalledOnce();
    expect(spies.onPlay).not.toHaveBeenCalled();
  },
};

export const WhileThePageLoads: Story = {
  args: { ...mockData.props, ...spies, loading: true },
  play: async ({ canvasElement }) => {
    for (const step of ['first', 'previous', 'next', 'last'] as const) {
      expect(control(canvasElement, step).disabled).toBe(true);
    }
  },
};

export const KeepingTheRecordCentred: Story = {
  args: { ...mockData.props, ...spies, tracking: 'center' },
  play: async ({ canvasElement }) => {
    clearSpies();

    const icon = canvasElement.querySelector('[data-control="tracking"] .v-icon');
    expect(icon?.getAttribute('data-name')).toBe('gps_fixed');

    await userEvent.click(control(canvasElement, 'tracking'));

    expect(spies['onUpdate:tracking']).toHaveBeenCalledWith('off');
  },
};
