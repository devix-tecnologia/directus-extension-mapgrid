import { describe, expect, it } from 'vitest';
import {
  parseClusterFeature,
  parseClusterFeatures,
  parseClusterProperties,
  parseMarkerFeature,
  parseMarkerProperties,
} from './map-feature';

const point = (coordinates: [number, number]) => ({ type: 'Point', coordinates });

describe('parseMarkerProperties — maplibre hands back properties as any', () => {
  it('reads the id and label that buildPointFeatureCollection wrote', () => {
    expect(parseMarkerProperties({ id: 7, formattedTitle: 'Brasília' })).toEqual({
      id: 7,
      formattedTitle: 'Brasília',
    });
  });

  it('accepts a string id, because a collection’s primary key may be a uuid', () => {
    expect(parseMarkerProperties({ id: 'abc-123', formattedTitle: 'X' })?.id).toBe('abc-123');
  });

  it('rejects a missing label, because a popup with no text is worse than an ignored click', () => {
    expect(parseMarkerProperties({ id: 1 })).toBeNull();
    expect(parseMarkerProperties({ id: 1, formattedTitle: 42 })).toBeNull();
  });

  it('rejects a missing id, which would highlight the wrong grid row', () => {
    expect(parseMarkerProperties({ formattedTitle: 'X' })).toBeNull();
    expect(parseMarkerProperties({ id: null, formattedTitle: 'X' })).toBeNull();
  });

  it('rejects anything that is not an object, without throwing', () => {
    expect(parseMarkerProperties(null)).toBeNull();
    expect(parseMarkerProperties(undefined)).toBeNull();
    expect(parseMarkerProperties('text')).toBeNull();
  });
});

describe('parseClusterProperties — clustering is maplibre’s, not ours', () => {
  it('reads the cluster id and how many items it gathers', () => {
    expect(parseClusterProperties({ cluster_id: 12, point_count: 5 })).toEqual({
      clusterId: 12,
      pointCount: 5,
    });
  });

  it('rejects a missing cluster_id, which would make getClusterExpansionZoom reject', () => {
    expect(parseClusterProperties({ point_count: 5 })).toBeNull();
    expect(parseClusterProperties({ cluster_id: 'twelve', point_count: 5 })).toBeNull();
  });

  it('rejects a missing point_count, which would render as an "undefined" marker label', () => {
    expect(parseClusterProperties({ cluster_id: 12 })).toBeNull();
  });
});

describe('parseMarkerFeature — geometry and properties together', () => {
  it('returns the complete marker', () => {
    const marker = parseMarkerFeature({
      geometry: point([-47.9, -15.7]),
      properties: { id: 1, formattedTitle: 'Brasília' },
    });

    expect(marker).toEqual({ id: 1, formattedTitle: 'Brasília', coordinates: [-47.9, -15.7] });
  });

  it('returns null when the geometry is not a point, without looking at the properties', () => {
    expect(
      parseMarkerFeature({
        geometry: { type: 'LineString', coordinates: [[0, 0]] },
        properties: { id: 1, formattedTitle: 'X' },
      })
    ).toBeNull();
  });

  it('returns null when the feature arrives without properties', () => {
    expect(parseMarkerFeature({ geometry: point([0, 0]), properties: null })).toBeNull();
    expect(parseMarkerFeature({ geometry: point([0, 0]) })).toBeNull();
  });
});

describe('parseClusterFeature', () => {
  it('returns the complete cluster', () => {
    expect(
      parseClusterFeature({
        geometry: point([-46.6, -23.5]),
        properties: { cluster_id: 3, point_count: 12 },
      })
    ).toEqual({ clusterId: 3, pointCount: 12, coordinates: [-46.6, -23.5] });
  });
});

describe('parseClusterFeatures — the list querySourceFeatures returns', () => {
  it('preserves the order of the valid clusters', () => {
    const clusters = parseClusterFeatures([
      { geometry: point([1, 1]), properties: { cluster_id: 1, point_count: 2 } },
      { geometry: point([2, 2]), properties: { cluster_id: 2, point_count: 3 } },
    ]);

    expect(clusters.map((cluster) => cluster.clusterId)).toEqual([1, 2]);
  });

  it('drops what does not parse instead of interrupting the drawing of the rest', () => {
    const clusters = parseClusterFeatures([
      { geometry: point([1, 1]), properties: { cluster_id: 1, point_count: 2 } },
      { geometry: point([2, 2]), properties: { point_count: 3 } },
      { geometry: null, properties: { cluster_id: 3, point_count: 4 } },
      { geometry: point([4, 4]), properties: { cluster_id: 4, point_count: 5 } },
    ]);

    expect(clusters.map((cluster) => cluster.clusterId)).toEqual([1, 4]);
  });

  it('returns an empty list when nothing clusters', () => {
    expect(parseClusterFeatures([])).toEqual([]);
  });
});
