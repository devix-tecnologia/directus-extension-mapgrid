import { describe, expect, it } from 'vitest';
import { DistanceMeasure } from './distance-measure';

const measure = new DistanceMeasure();

const SAO_PAULO: [number, number] = [-46.6333, -23.5505];
const RIO: [number, number] = [-43.1729, -22.9068];

describe('DistanceMeasure', () => {
  it('measures São Paulo to Rio at about 360 km in a straight line', () => {
    const distance = measure.between(SAO_PAULO, RIO);

    expect(distance).toBeGreaterThan(355_000);
    expect(distance).toBeLessThan(365_000);
  });

  it('measures a degree of latitude at about 111 km', () => {
    expect(measure.between([0, 0], [0, 1]) / 1_000).toBeCloseTo(111.2, 1);
  });

  it('gives each leg and the sum of them', () => {
    const points: [number, number][] = [
      [0, 0],
      [0, 1],
      [0, 3],
    ];

    const legs = measure.legs(points);
    expect(legs).toHaveLength(2);
    expect(measure.total(points)).toBeCloseTo((legs[0] ?? 0) + (legs[1] ?? 0), 6);
  });

  it('measures nothing with fewer than two points', () => {
    expect(measure.legs([[0, 0]])).toEqual([]);
    expect(measure.total([])).toBe(0);
  });

  it('reads in metres below a kilometre and in kilometres above', () => {
    expect(measure.format(850.4, 'en-US')).toBe('850 m');
    expect(measure.format(2_450, 'en-US')).toBe('2.45 km');
    expect(measure.format(23_680, 'pt-BR')).toBe('23,68 km');
  });
});
