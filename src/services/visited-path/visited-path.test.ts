import { describe, expect, it } from 'vitest';
import { VisitedPath } from './visited-path';

describe('VisitedPath', () => {
  it('keeps the visits in the order they happened', () => {
    const path = new VisitedPath();
    path.visit(1, [0, 0]);
    path.visit(2, [1, 1]);
    path.visit(3, [2, 2]);

    expect(path.points(10).map((visit) => visit.id)).toEqual([1, 2, 3]);
    expect(path.last()?.id).toBe(3);
    expect(path.previous()?.id).toBe(2);
  });

  it('gives only the most recent visits when asked for fewer', () => {
    const path = new VisitedPath();
    for (const id of [1, 2, 3, 4]) path.visit(id, [id, id]);

    expect(path.points(2).map((visit) => visit.id)).toEqual([3, 4]);
    expect(path.points(0)).toEqual([]);
  });

  it('does not repeat the record it is already on', () => {
    const path = new VisitedPath();
    path.visit(1, [0, 0]);
    path.visit(1, [0, 0]);

    expect(path.points(10)).toHaveLength(1);
    expect(path.previous()).toBeNull();
  });

  it('visits a record again after leaving it, as a walk back and forth does', () => {
    const path = new VisitedPath();
    path.visit(1, [0, 0]);
    path.visit(2, [1, 1]);
    path.visit(1, [0, 0]);

    expect(path.points(10).map((visit) => visit.id)).toEqual([1, 2, 1]);
  });

  it('forgets the oldest visits past its capacity', () => {
    const path = new VisitedPath(3);
    for (const id of [1, 2, 3, 4, 5]) path.visit(id, [id, id]);

    expect(path.points(10).map((visit) => visit.id)).toEqual([3, 4, 5]);
  });

  it('fills a coordinate the map did not have yet', () => {
    const path = new VisitedPath();
    path.visit(1, null);
    path.visit(2, [1, 1]);

    path.resolve((id) => (id === 1 ? [5, 5] : null));

    expect(path.points(10).map((visit) => visit.coordinate)).toEqual([
      [5, 5],
      [1, 1],
    ]);
  });

  it('starts over when cleared', () => {
    const path = new VisitedPath();
    path.visit(1, [0, 0]);
    path.clear();

    expect(path.last()).toBeNull();
    expect(path.points(10)).toEqual([]);
  });
});
