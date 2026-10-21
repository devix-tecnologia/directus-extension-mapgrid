import type { Coordinate } from '../item-geometry/index';
import type { RecordId } from '../record-sequence/index';
import type { IVisitedPath, Visit } from './visited-path.types';

/** The longest trail the options allow, so nothing a trail can ask for is ever forgotten. */
export const VISITED_PATH_CAPACITY = 200;

export class VisitedPath implements IVisitedPath {
  private visits: Visit[] = [];

  constructor(private readonly capacity: number = VISITED_PATH_CAPACITY) {}

  visit(id: RecordId, coordinate: Coordinate | null): void {
    const last = this.last();
    if (last?.id === id) {
      if (last.coordinate === null) last.coordinate = coordinate;
      return;
    }

    this.visits.push({ id, coordinate });
    if (this.visits.length > this.capacity)
      this.visits.splice(0, this.visits.length - this.capacity);
  }

  points(limit: number): readonly Visit[] {
    if (limit <= 0) return [];
    return this.visits.slice(-limit);
  }

  last(): Visit | null {
    return this.visits[this.visits.length - 1] ?? null;
  }

  previous(): Visit | null {
    return this.visits[this.visits.length - 2] ?? null;
  }

  resolve(locate: (id: RecordId) => Coordinate | null): void {
    for (const visit of this.visits) {
      if (visit.coordinate === null) visit.coordinate = locate(visit.id);
    }
  }

  clear(): void {
    this.visits = [];
  }
}
