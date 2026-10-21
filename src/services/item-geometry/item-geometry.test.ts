import { describe, expect, it } from 'vitest';
import { ItemGeometry } from './item-geometry';

const geometry = new ItemGeometry();

describe('ItemGeometry — the points of a geometry', () => {
  it('reads a point', () => {
    expect(geometry.pointsOf({ type: 'Point', coordinates: [-40.3, -20.3] })).toEqual([
      [-40.3, -20.3],
    ]);
  });

  it('reads every vertex of a nested geometry', () => {
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    };
    expect(geometry.pointsOf(polygon)).toHaveLength(4);
  });

  it('gives up on the whole geometry when one position is out of range', () => {
    expect(
      geometry.pointsOf({
        type: 'LineString',
        coordinates: [
          [0, 0],
          [0, 91],
        ],
      })
    ).toEqual([]);
  });

  it('gives nothing back for what is not a geometry', () => {
    expect(geometry.pointsOf(null)).toEqual([]);
    expect(geometry.pointsOf({ coordinates: 'here' })).toEqual([]);
  });
});

describe('ItemGeometry — the centre', () => {
  it('is the middle of the bounding box, not of the vertices', () => {
    expect(
      geometry.centreOf([
        [0, 0],
        [1, 0],
        [10, 4],
      ])
    ).toEqual([5, 2]);
  });

  it('is nothing without points', () => {
    expect(geometry.centreOf([])).toBeNull();
  });
});
