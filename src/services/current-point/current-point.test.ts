import { describe, expect, it } from 'vitest';
import { DirectusCurrentPoint } from './current-point';

const BRASILIA: [number, number] = [-47.9292, -15.7801];
const VIEWPORT = { height: 400, width: 800 };

/** The Directus map state, as the embedded layout hands it over. */
const mapState = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  cameraOptions: { center: BRASILIA, zoom: 4 },
  featureId: 'id',
  geojson: {
    features: [
      {
        geometry: { coordinates: BRASILIA, type: 'Point' },
        properties: { id: 1 },
        type: 'Feature',
      },
    ],
    type: 'FeatureCollection',
  },
  ...overrides,
});

const currentPoint = (
  state: Record<string, unknown>,
  viewport: { height: number; width: number } | null = VIEWPORT
) => new DirectusCurrentPoint(state, () => viewport);

describe('DirectusCurrentPoint', () => {
  it('puts the record the camera is centred on at the centre of the pane', () => {
    const point = currentPoint(mapState()).screenPointOf({ id: 1 });

    expect(point?.x).toBeCloseTo(400, 6);
    expect(point?.y).toBeCloseTo(200, 6);
  });

  it('places a record east of the camera to the right of the centre, in map pixels', () => {
    const state = mapState({
      geojson: {
        features: [
          {
            geometry: { coordinates: [BRASILIA[0] + 1, BRASILIA[1]], type: 'Point' },
            properties: { id: 1 },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      },
    });

    const point = currentPoint(state).screenPointOf({ id: 1 });

    // 512px of world per tile at zoom 0, doubled at each zoom: one degree is 8192/360 px at zoom 4
    expect(point?.x).toBeCloseTo(400 + 8192 / 360, 6);
    expect(point?.y).toBeCloseTo(200, 6);
  });

  it('frames a line by the centre of its bounding box, like the centerer does', () => {
    const state = mapState({
      geojson: {
        features: [
          {
            geometry: {
              coordinates: [
                [BRASILIA[0] - 1, BRASILIA[1]],
                [BRASILIA[0] + 1, BRASILIA[1]],
              ],
              type: 'LineString',
            },
            properties: { id: 1 },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      },
    });

    const point = currentPoint(state).screenPointOf({ id: 1 });

    expect(point?.x).toBeCloseTo(400, 6);
  });

  it('falls back to the native geometry on the item when the map has no feature for it', () => {
    const state = mapState({
      geojson: { features: [], type: 'FeatureCollection' },
      geometryField: 'location',
      isGeometryFieldNative: true,
    });

    const point = currentPoint(state).screenPointOf({
      id: 1,
      location: { coordinates: BRASILIA, type: 'Point' },
    });

    expect(point?.x).toBeCloseTo(400, 6);
    expect(point?.y).toBeCloseTo(200, 6);
  });

  it('reads the camera the map publishes, whose centre is a LngLat and not a pair', () => {
    // what `moveend` hands over, and what ends up written to the preset
    const state = mapState({
      cameraOptions: {
        bearing: 0,
        center: { lat: BRASILIA[1], lng: BRASILIA[0] },
        pitch: 0,
        zoom: 4,
      },
    });

    const point = currentPoint(state).screenPointOf({ id: 1 });

    expect(point?.x).toBeCloseTo(400, 6);
    expect(point?.y).toBeCloseTo(200, 6);
  });

  it('turns with the map when it is rotated, so the mark stays on the record', () => {
    const state = mapState({
      cameraOptions: { bearing: 90, center: BRASILIA, zoom: 4 },
      geojson: {
        features: [
          {
            geometry: { coordinates: [BRASILIA[0] + 1, BRASILIA[1]], type: 'Point' },
            properties: { id: 1 },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      },
    });

    const point = currentPoint(state).screenPointOf({ id: 1 });

    // with east up, the record east of the camera is above the centre
    expect(point?.x).toBeCloseTo(400, 6);
    expect(point?.y).toBeCloseTo(200 - 8192 / 360, 6);
  });

  it('gives up on a tilted map, where a flat projection would place the mark elsewhere', () => {
    const state = mapState({ cameraOptions: { center: BRASILIA, pitch: 30, zoom: 4 } });

    expect(currentPoint(state).screenPointOf({ id: 1 })).toBeNull();
  });

  it('gives up when the item has no geometry anywhere', () => {
    const state = mapState({ geojson: { features: [], type: 'FeatureCollection' } });

    expect(currentPoint(state).screenPointOf({ id: 1 })).toBeNull();
  });

  it('gives up before the map says where its camera is', () => {
    const state = mapState({ cameraOptions: undefined });

    expect(currentPoint(state).screenPointOf({ id: 1 })).toBeNull();
  });

  it('gives up while the pane has no size to place the point in', () => {
    expect(currentPoint(mapState(), null).screenPointOf({ id: 1 })).toBeNull();
    expect(currentPoint(mapState(), { height: 0, width: 0 }).screenPointOf({ id: 1 })).toBeNull();
  });
});
