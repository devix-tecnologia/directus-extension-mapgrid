import type {
  BoundingBox,
  CentererSchedule,
  CenteringOptions,
  CollectionSource,
  IMapCenterer,
  ViewportSize,
} from './map-centerer.types';

const DIRECTUS_FIT_BOUNDS_PADDING = 100;
const MAX_MERCATOR_LATITUDE = 85.05112878;
const MAPLIBRE_WORLD_WIDTH_AT_ZOOM_0 = 512;
const RETRY_INTERVAL_MS = 250;
const MAP_LOAD_DEADLINE_MS = 10_000;

interface Retry {
  cancel: () => void;
  target: BoundingBox;
  geojson: { bbox?: unknown };
  original: unknown;
  attempts: number;
}

/**
 * Temporary workaround for a limitation of the Directus map component
 * (measured on 10.13.1): it does not move the camera once mounted — the
 * MapLibre instance is private and the `camera` prop is only read on
 * construction. Remounting the component on every step, as navigating between
 * records requires, is not viable.
 *
 * The workaround uses the component's `bounds` watcher, which calls
 * `fitBounds(data.bbox)`: it swaps the `geojson`'s `bbox` for the target, hands
 * over a fresh `geojsonBounds` and puts the original `bbox` back afterwards.
 * That watcher only exists after MapLibre's `load`, so until the first
 * `moveend` the request is re-delivered periodically.
 *
 * It depends on Directus internals — `geojson`, `geojsonBounds` and the
 * `bounds` watcher. Once the component supports centering natively, this class
 * is the only place to change.
 */
export class DirectusMapCenterer implements IMapCenterer {
  private readonly state: Record<string, unknown>;
  private readonly viewportSize: () => ViewportSize | null;
  private readonly schedule: CentererSchedule;
  private readonly collection: CollectionSource;
  private geometryRequest = 0;
  private mapReady = false;
  private retry: Retry | null = null;

  /**
   * @param state the embedded map layout's state (`EmbeddedLayout.state`)
   * @param viewportSize the size of the map area, to discount the padding
   * @param schedule the clock — `nextTick` and `setInterval` in production
   * @param collection the grid's items, for when the map does not have all of them
   */
  constructor(
    state: Record<string, unknown>,
    viewportSize: () => ViewportSize | null,
    schedule: CentererSchedule,
    collection: CollectionSource = { fetchItems: async () => [], gridItems: () => [] }
  ) {
    this.state = state;
    this.viewportSize = viewportSize;
    this.schedule = schedule;
    this.collection = collection;
  }

  center(geometry: unknown, options: CenteringOptions = {}): boolean {
    const onlyIfOutside = options.onlyIfOutside ?? true;
    const points = this.pointsOf(geometry);
    if (points.length === 0) return false;

    const bounds = this.boundingBoxOf(points);
    const visible = this.visibleArea();
    if (onlyIfOutside && visible && this.contains(visible, bounds)) return false;

    const geojson = this.state.geojson as { bbox?: unknown } | null | undefined;
    if (typeof geojson !== 'object' || geojson === null) return false;

    const [single] = points;
    const target =
      points.length === 1 && single && !options.zoomIn
        ? this.boundingBoxKeepingZoom(single, visible)
        : bounds;

    const bboxBeforeRequests = this.retry?.original ?? geojson.bbox;
    this.retry?.cancel();
    this.retry = null;

    this.deliver(geojson, target);
    if (this.mapReady) {
      this.schedule.afterUpdate(() => {
        geojson.bbox = bboxBeforeRequests;
      });
      return true;
    }

    const retry: Retry = {
      cancel: () => {},
      target,
      geojson,
      original: bboxBeforeRequests,
      attempts: 0,
    };
    const limit = Math.ceil(MAP_LOAD_DEADLINE_MS / RETRY_INTERVAL_MS);
    retry.cancel = this.schedule.repeat(() => {
      retry.attempts += 1;
      if (retry.attempts >= limit) {
        this.stopRetrying();
        return;
      }
      this.deliver(geojson, target);
    }, RETRY_INTERVAL_MS);
    this.retry = retry;
    return true;
  }

  /** Call on every `cameraOptions` change in the state — the Directus `moveend`. */
  onCameraMove(): void {
    this.mapReady = true;
    const retry = this.retry;
    if (!retry) return;

    retry.cancel();
    this.retry = null;
    this.deliver(retry.geojson, retry.target);
    this.schedule.afterUpdate(() => {
      retry.geojson.bbox = retry.original;
    });
  }

  centerItem(item: Record<string, unknown>, options: CenteringOptions = {}): boolean {
    const request = ++this.geometryRequest;
    const key = this.state.featureId;
    if (typeof key !== 'string') return false;
    const features = (this.state.geojson as { features?: unknown } | null | undefined)?.features;
    const feature = (Array.isArray(features) ? features : []).find(
      (candidate) =>
        (candidate as { properties?: Record<string, unknown> } | null)?.properties?.[key] ===
        item[key]
    ) as { geometry?: unknown } | undefined;
    if (feature) return this.center(feature.geometry, options);

    const field = this.nativeGeometryField();
    if (!field) return false;
    if (item[field] != null) return this.center(item[field], options);

    this.collection
      .fetchItems([item[key]], [key, field])
      .then(([fetched]) => {
        if (request === this.geometryRequest && fetched) this.center(fetched[field], options);
      })
      .catch(() => {});
    return true;
  }

  fitAll(): void {
    const request = ++this.geometryRequest;
    this.stopRetrying();
    const field = this.nativeGeometryField();
    const key = this.state.featureId;
    const fitDataBounds = () => (this.state.fitDataBounds as (() => void) | undefined)?.();
    if (!field || typeof key !== 'string') {
      fitDataBounds();
      return;
    }

    const frame = (items: readonly Record<string, unknown>[]) => {
      const points = items.flatMap((item) => this.pointsOf(item[field]));
      if (points.length > 0) {
        this.center({ coordinates: points, type: 'MultiPoint' }, { onlyIfOutside: false });
      } else {
        fitDataBounds();
      }
    };

    const items = this.collection.gridItems();
    const withGeometry = items.filter((item) => item[field] != null);
    const withoutGeometry = items.filter((item) => item[field] == null).map((item) => item[key]);
    if (withoutGeometry.length === 0) {
      frame(withGeometry);
      return;
    }

    this.collection
      .fetchItems(withoutGeometry, [key, field])
      .then((fetched) => {
        if (request === this.geometryRequest) frame([...withGeometry, ...fetched]);
      })
      .catch(() => {
        if (request === this.geometryRequest) fitDataBounds();
      });
  }

  // with native geometry Directus only fetches the items in the visible area
  private nativeGeometryField(): string | null {
    const field = this.state.geometryField;
    return this.state.isGeometryFieldNative === true && typeof field === 'string' ? field : null;
  }

  private stopRetrying(): void {
    const retry = this.retry;
    if (!retry) return;
    retry.cancel();
    retry.geojson.bbox = retry.original;
    this.retry = null;
  }

  private deliver(geojson: { bbox?: unknown }, target: BoundingBox): void {
    geojson.bbox = target;
    this.state.geojsonBounds = [...target];
  }

  private visibleArea(): BoundingBox | null {
    const bbox = (this.state.cameraOptions as { bbox?: unknown } | null | undefined)?.bbox;
    return this.isBoundingBox(bbox) ? bbox : null;
  }

  private contains(outer: BoundingBox, inner: BoundingBox): boolean {
    return (
      inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3]
    );
  }

  private isBoundingBox(value: unknown): value is BoundingBox {
    return (
      Array.isArray(value) &&
      value.length === 4 &&
      value.every((n) => typeof n === 'number' && Number.isFinite(n))
    );
  }

  private mercatorLatitude(y: number): number {
    return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
  }

  private mercator(latitude: number): number {
    const clamped = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
    return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
  }

  private pointsOf(geometry: unknown): [number, number][] {
    const coordinates = (geometry as { coordinates?: unknown } | null | undefined)?.coordinates;
    const points: [number, number][] = [];
    const visit = (value: unknown): boolean => {
      if (!Array.isArray(value)) return false;
      if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
        const [lng, lat] = value as [number, number];
        if (
          !Number.isFinite(lng) ||
          !Number.isFinite(lat) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180
        ) {
          return false;
        }
        points.push([lng, lat]);
        return true;
      }
      return value.every(visit);
    };
    return visit(coordinates) ? points : [];
  }

  private boundingBoxOf(points: [number, number][]): BoundingBox {
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  }

  // in Mercator, the projection in which the map's zoom is linear
  private boundingBoxKeepingZoom(
    point: [number, number],
    visible: BoundingBox | null
  ): BoundingBox {
    const viewport = this.viewportSize();
    const margin = 2 * DIRECTUS_FIT_BOUNDS_PADDING;
    const zoom = (this.state.cameraOptions as { zoom?: unknown } | null | undefined)?.zoom;
    const hasZoom = typeof zoom === 'number' && Number.isFinite(zoom);
    if (
      (!visible && !hasZoom) ||
      !viewport ||
      viewport.width <= margin ||
      viewport.height <= margin
    ) {
      return [point[0], point[1], point[0], point[1]];
    }

    let width: number;
    let height: number;
    if (visible) {
      width = ((visible[2] - visible[0]) * (viewport.width - margin)) / viewport.width;
      height =
        ((this.mercator(visible[3]) - this.mercator(visible[1])) * (viewport.height - margin)) /
        viewport.height;
    } else {
      const world = MAPLIBRE_WORLD_WIDTH_AT_ZOOM_0 * 2 ** (zoom as number);
      width = (360 * (viewport.width - margin)) / world;
      height = (2 * Math.PI * (viewport.height - margin)) / world;
    }
    const centerY = this.mercator(point[1]);
    return [
      point[0] - width / 2,
      this.mercatorLatitude(centerY - height / 2),
      point[0] + width / 2,
      this.mercatorLatitude(centerY + height / 2),
    ];
  }
}
