/**
 * How the height is shared between the map and the grid, as the map's share of
 * it: `0.6` is 60% for the map and the timeline, the rest for the grid.
 *
 * Bounded so neither side disappears: a map too short to read a point on, or a
 * grid without room for its header and a row.
 */
export interface IPaneSplit {
  /** Reads the share back from the preset, which can hold anything. */
  from(value: unknown): number;
  /** The share under a pointer, from where the container starts and how tall it is. */
  atPointer(pointerY: number, top: number, height: number): number;
  /** A step of the keyboard, up or down, kept within the bounds. */
  step(share: number, direction: 1 | -1): number;
}
