import { describe, expect, it } from 'vitest';
import { RecordHeading } from './record-heading';

const heading = new RecordHeading();

const SAO_PAULO: [number, number] = [-46.6333, -23.5505];
const RIO: [number, number] = [-43.1729, -22.9068];

describe('RecordHeading — the azimuth between two positions', () => {
  it('points north, east, south and west along the axes', () => {
    expect(heading.azimuth([0, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(heading.azimuth([0, 0], [1, 0])).toBeCloseTo(90, 6);
    expect(heading.azimuth([0, 0], [0, -1])).toBeCloseTo(180, 6);
    expect(heading.azimuth([0, 0], [-1, 0])).toBeCloseTo(270, 6);
  });

  it('goes from São Paulo to Rio slightly north of east', () => {
    const azimuth = heading.azimuth(SAO_PAULO, RIO) ?? Number.NaN;
    expect(azimuth).toBeGreaterThan(70);
    expect(azimuth).toBeLessThan(80);
  });

  it('has no answer between two equal positions', () => {
    expect(heading.azimuth(RIO, RIO)).toBeNull();
  });
});

describe('RecordHeading — the course read from the data', () => {
  it('normalises a signed course, as trackers send it', () => {
    expect(heading.fromField(-137)).toBe(223);
    expect(heading.fromField(-0)).toBe(0);
  });

  it('folds whole turns away', () => {
    expect(heading.fromField(370)).toBe(10);
    expect(heading.fromField(720)).toBe(0);
  });

  it('reads a numeric string, and nothing else', () => {
    expect(heading.fromField('45')).toBe(45);
    expect(heading.fromField('north')).toBeNull();
    expect(heading.fromField(null)).toBeNull();
    expect(heading.fromField('')).toBeNull();
    expect(heading.fromField(Number.NaN)).toBeNull();
  });
});

describe('RecordHeading — the angle to draw', () => {
  it('measures clockwise from the top of the pane', () => {
    expect(heading.screenAngle({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(0, 6);
    expect(heading.screenAngle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(90, 6);
    expect(heading.screenAngle({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(180, 6);
  });

  it('draws nothing between two points on the same pixel', () => {
    expect(heading.screenAngle({ x: 3, y: 3 }, { x: 3.1, y: 3 })).toBeNull();
  });

  it('discounts the camera rotation from a geographic heading', () => {
    expect(heading.onScreen(90, 30)).toBe(60);
    expect(heading.onScreen(10, 30)).toBe(340);
  });
});

describe('RecordHeading — what the preset gives back', () => {
  it('keeps a saved source and falls back to off', () => {
    expect(heading.sourceFrom('field')).toBe('field');
    expect(heading.sourceFrom('computed')).toBe('computed');
    expect(heading.sourceFrom('compass')).toBe('off');
    expect(heading.sourceFrom(undefined)).toBe('off');
  });
});
