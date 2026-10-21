import type { LayoutConfig, LayoutProps } from '@directus/types';
import type { Component } from 'vue';

/**
 * A Directus layout running inside ours.
 *
 * `state` is what its `setup()` returned, plus the props and the
 * `onUpdate:<key>` handlers — the same composition `createLayoutWrapper`
 * assembles. `component` and `optionsComponent` are what draws the area and the
 * panel.
 */
export interface EmbeddedLayout {
  readonly id: string;
  readonly state: Record<string, unknown>;
  readonly component: Component | null;
  readonly optionsComponent: Component | null;
}

/** What the app's layout registry hands over. */
export type LayoutRegistry = readonly LayoutConfig[];

/**
 * The state the embedded layouts share.
 *
 * `selection` and `layoutQuery` are two of the three props that go up as emits
 * in the Directus contract, and they are how map and grid stay in sync: sorting
 * in one refetches the other, and marking a row lights up the marker.
 * `layoutOptions` belongs to each one — the map keeps the geometry field there,
 * the grid the spacing.
 */
export interface SharedState {
  selection: (string | number)[];
  layoutQuery: Record<string, unknown>;
}

export interface EmbedOptions {
  readonly id: string;
  readonly registry: LayoutRegistry;
  readonly props: LayoutProps;
  readonly emit: (event: string, value: unknown) => void;
}
