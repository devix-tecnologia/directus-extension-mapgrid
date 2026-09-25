/** `[west, south, east, north]`, in degrees — the shape of GeoJSON's `bbox`. */
export type BoundingBox = [number, number, number, number];

/** The size, in pixels, of the area the map is drawn in. */
export interface ViewportSize {
  width: number;
  height: number;
}

/** The centerer's clock — `nextTick` and `setInterval` in production. */
export interface CentererSchedule {
  /** Runs after Vue has propagated the props — `nextTick` in production. */
  afterUpdate(task: () => void): void;
  /** Runs every `intervalMs` until the returned function is called. */
  repeat(task: () => void, intervalMs: number): () => void;
}

/** The collection's items, for when the map does not have all of them. */
export interface CollectionSource {
  /** The items of the grid's page, unfiltered by the visible area. */
  gridItems(): readonly Record<string, unknown>[];
  /** The items under `keys`, with only the requested `fields`. */
  fetchItems(
    keys: readonly unknown[],
    fields: readonly string[]
  ): Promise<Record<string, unknown>[]>;
}

export interface CenteringOptions {
  /** Frames the point by itself, up to the Directus `maxZoom`, instead of keeping the zoom. Default: `false`. */
  zoomIn?: boolean;
  /** Does not move when the target is already in the visible area. Default: `true`. */
  onlyIfOutside?: boolean;
}

/**
 * Takes the map to a geometry.
 *
 * A point is centered keeping the current zoom; a line or a polygon is framed
 * whole. A geometry that cannot be read leaves the camera alone.
 */
export interface IMapCenterer {
  /** Returns whether it asked the map to move. */
  center(geometry: unknown, options?: CenteringOptions): boolean;
  /** Centers a collection item by the feature the map built for it. */
  centerItem(item: Record<string, unknown>, options?: CenteringOptions): boolean;
  /** Frames the whole collection. */
  fitAll(): void;
}
