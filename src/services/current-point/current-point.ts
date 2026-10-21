import { ItemGeometry } from '../item-geometry/index';
import type { Coordinate, ICurrentPoint, ScreenPoint, ViewportSize } from './current-point.types';

const MAPLIBRE_WORLD_WIDTH_AT_ZOOM_0 = 512;
const MAX_MERCATOR_LATITUDE = 85.05112878;

interface Camera {
  bearing: number;
  center: Coordinate;
  zoom: number;
}

/**
 * Temporary workaround for two limitations of the Directus map layout
 * (measured on 10.13.1): the clustering is a single option of the one
 * `__directus` source — a record inside a cluster has no point of its own to
 * show — and the MapLibre instance is private, so there is no second source, no
 * marker and no `project()` to borrow.
 *
 * So the point is placed beside the map: the geometry is projected onto the
 * pane by the same Web Mercator the map uses, from the camera the layout
 * publishes, and the composition draws a mark of its own at that position.
 *
 * One consequence of the camera being read and not watched: the Directus map
 * only publishes `cameraOptions` on `moveend`, so between asking for a move and
 * the camera landing the projection is still the old one — the composition
 * hides the mark while it waits.
 *
 * Once the map component draws the current record natively, or the map contract
 * of task-011 owns a real marker, this class is the only place to change.
 */
export class DirectusCurrentPoint implements ICurrentPoint {
  private readonly geometry = new ItemGeometry();

  /**
   * @param state the embedded map layout's state (`EmbeddedLayout.state`)
   * @param viewportSize the size of the map area, in pixels
   */
  constructor(
    private readonly state: Record<string, unknown>,
    private readonly viewportSize: () => ViewportSize | null
  ) {}

  screenPointOf(item: Record<string, unknown>): ScreenPoint | null {
    const coordinate = this.coordinateOf(item);
    return coordinate ? this.screenPointOfCoordinate(coordinate) : null;
  }

  coordinateOf(item: Record<string, unknown>): Coordinate | null {
    return this.geometry.centreOf(this.geometry.pointsOf(this.geometryOf(item)));
  }

  screenPointOfCoordinate([longitude, latitude]: Coordinate): ScreenPoint | null {
    const frame = this.frame();
    if (!frame) return null;
    const { camera, viewport } = frame;

    const world = MAPLIBRE_WORLD_WIDTH_AT_ZOOM_0 * 2 ** camera.zoom;
    const east =
      (this.worldX(this.unwrap(longitude, camera.center[0])) - this.worldX(camera.center[0])) *
      world;
    const south = (this.worldY(latitude) - this.worldY(camera.center[1])) * world;
    const bearing = (camera.bearing * Math.PI) / 180;
    return {
      x: east * Math.cos(bearing) + south * Math.sin(bearing) + viewport.width / 2,
      y: -east * Math.sin(bearing) + south * Math.cos(bearing) + viewport.height / 2,
    };
  }

  coordinateAt(point: ScreenPoint): Coordinate | null {
    const frame = this.frame();
    if (!frame) return null;
    const { camera, viewport } = frame;

    const world = MAPLIBRE_WORLD_WIDTH_AT_ZOOM_0 * 2 ** camera.zoom;
    const dx = point.x - viewport.width / 2;
    const dy = point.y - viewport.height / 2;
    const bearing = (camera.bearing * Math.PI) / 180;
    const east = dx * Math.cos(bearing) - dy * Math.sin(bearing);
    const south = dx * Math.sin(bearing) + dy * Math.cos(bearing);

    const x = this.worldX(camera.center[0]) + east / world;
    const y = this.worldY(camera.center[1]) + south / world;
    const longitude = x * 360 - 180;
    const latitude = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
    return [((((longitude + 180) % 360) + 360) % 360) - 180, latitude];
  }

  bearing(): number | null {
    return this.camera()?.bearing ?? null;
  }

  private frame(): { camera: Camera; viewport: ViewportSize } | null {
    const camera = this.camera();
    const viewport = this.viewportSize();
    if (!camera || !viewport || viewport.width <= 0 || viewport.height <= 0) return null;
    return { camera, viewport };
  }

  /** Within 180° of the camera, so a point across the antimeridian lands on this side of the world. */
  private unwrap(longitude: number, centre: number): number {
    let unwrapped = longitude;
    while (unwrapped - centre > 180) unwrapped -= 360;
    while (unwrapped - centre < -180) unwrapped += 360;
    return unwrapped;
  }

  /** The feature the map built for the item, or the item's own native geometry. */
  private geometryOf(item: Record<string, unknown>): unknown {
    const key = this.state.featureId;
    if (typeof key !== 'string') return null;

    const features = (this.state.geojson as { features?: unknown } | null | undefined)?.features;
    const feature = (Array.isArray(features) ? features : []).find(
      (candidate) =>
        (candidate as { properties?: Record<string, unknown> } | null)?.properties?.[key] ===
        item[key]
    ) as { geometry?: unknown } | undefined;
    if (feature) return feature.geometry;

    const field = this.state.geometryField;
    if (this.state.isGeometryFieldNative !== true || typeof field !== 'string') return null;
    return item[field] ?? null;
  }

  /**
   * The camera the map published, in either of the two shapes it comes in: the
   * pair a seeded preset carries, and the MapLibre `LngLat` of the `moveend`,
   * which is what ends up written to the preset afterwards.
   *
   * A tilted map has no answer here — the perspective is not a rotation — so
   * it gives up rather than drawing the mark somewhere else.
   */
  private camera(): Camera | null {
    const camera = this.state.cameraOptions as
      | { bearing?: unknown; center?: unknown; pitch?: unknown; zoom?: unknown }
      | null
      | undefined;
    const zoom = camera?.zoom;
    if (typeof zoom !== 'number' || !Number.isFinite(zoom)) return null;
    if (typeof camera?.pitch === 'number' && camera.pitch !== 0) return null;

    const center = this.longitudeLatitudeOf(camera?.center);
    if (!center) return null;

    const bearing = camera?.bearing;
    return {
      bearing: typeof bearing === 'number' && Number.isFinite(bearing) ? bearing : 0,
      center,
      zoom,
    };
  }

  private longitudeLatitudeOf(center: unknown): Coordinate | null {
    if (Array.isArray(center) && typeof center[0] === 'number' && typeof center[1] === 'number') {
      return [center[0], center[1]];
    }
    const pair = center as { lat?: unknown; lng?: unknown } | null | undefined;
    if (typeof pair?.lng === 'number' && typeof pair.lat === 'number') return [pair.lng, pair.lat];
    return null;
  }

  /** In world fractions, `[0, 1]` across the whole map. */
  private worldX(longitude: number): number {
    return (longitude + 180) / 360;
  }

  private worldY(latitude: number): number {
    const clamped = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
    const radians = (clamped * Math.PI) / 180;
    return 0.5 - Math.log(Math.tan(Math.PI / 4 + radians / 2)) / (2 * Math.PI);
  }
}
