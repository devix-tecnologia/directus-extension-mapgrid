/**
 * The catalogue of mappable collections used by stories and tests.
 *
 * Each entry is a coherent collection — items and fields — rather than a loose
 * list of points. The set exists to show what
 * the extension is: scattered points, clustered points, points on both sides of
 * the date line, and a half-filled collection, all in the same component. One
 * story per kind covers the behaviour each of them exercises.
 */

import type { GeoItem } from '../contract/index';

/** A collection field as Storybook needs to see it. */
export interface CollectionFieldSummary {
  name: string;
  field: string;
  meta?: { interface?: string | null } | null;
}

export interface MappableKind {
  /** The collection name in Directus. */
  id: string;
  label: string;
  geolocationField: string;
  items: GeoItem[];
}

const pointAt = (coordinates: [number, number]) => ({ type: 'Point' as const, coordinates });

export const MAPPABLE_KINDS: MappableKind[] = [
  {
    id: 'landmarks',
    label: 'Scattered points',
    geolocationField: 'location',
    items: [
      { id: 1, name: 'Praça da Sé', city: 'São Paulo', location: pointAt([-46.6333, -23.5505]) },
      {
        id: 2,
        name: 'Museu do Amanhã',
        city: 'Rio de Janeiro',
        location: pointAt([-43.1943, -22.8942]),
      },
      {
        id: 3,
        name: 'Parque Ibirapuera',
        city: 'São Paulo',
        location: pointAt([-46.6598, -23.5874]),
      },
      {
        id: 4,
        name: 'Cristo Redentor',
        city: 'Rio de Janeiro',
        location: pointAt([-43.2105, -22.9519]),
      },
      {
        id: 5,
        name: 'Elevador Lacerda',
        city: 'Salvador',
        location: pointAt([-38.5133, -12.9742]),
      },
      { id: 6, name: 'Teatro Amazonas', city: 'Manaus', location: pointAt([-60.0234, -3.1301]) },
    ],
  },
  {
    id: 'units',
    label: 'Clustered points',
    geolocationField: 'position',
    // a dozen points within a few blocks: this is what makes clustering show up,
    // and therefore the only way a story can demonstrate a cluster
    items: Array.from({ length: 12 }, (_, index) => ({
      id: 100 + index,
      code: `UN-${String(index + 1).padStart(3, '0')}`,
      district: index % 2 === 0 ? 'Centro' : 'Bela Vista',
      status: index % 3 === 0 ? 'active' : 'maintenance',
      position: pointAt([-46.64 + index * 0.004, -23.55 + (index % 4) * 0.004]),
    })),
  },
  {
    id: 'sensors',
    label: 'Points on both sides of the date line',
    geolocationField: 'coord',
    // both sides of the 180th meridian: exercises the whole-turn adjustment,
    // without which the popup opens on a copy of the world that is off screen
    items: [
      { id: 'S-1', station: 'Taveuni', coord: pointAt([179.97, -16.85]) },
      { id: 'S-2', station: 'Vava’u', coord: pointAt([-174.0, -18.65]) },
      { id: 'S-3', station: 'Apia', coord: pointAt([-171.76, -13.83]) },
    ],
  },
  {
    id: 'works',
    label: 'Half-filled collection',
    geolocationField: 'site',
    // half the items have no point: they show in the grid and not on the map,
    // which is the behaviour buildPointFeatureCollection guarantees
    items: [
      { id: 10, title: 'Rio Negro bridge', crew: 'North crew', site: pointAt([-60.02, -3.13]) },
      { id: 11, title: 'Central overpass', crew: 'South crew', site: null },
      { id: 12, title: 'Eastern bypass', crew: 'East crew', site: pointAt([-49.27, -25.43]) },
      { id: 13, title: 'No site assigned', crew: 'West crew' },
    ],
  },
];

/** One collection from the catalogue by name. Throws for an unknown name, so a story fails loudly. */
export const mappableKind = (id: string): MappableKind => {
  const kind = MAPPABLE_KINDS.find((candidate) => candidate.id === id);
  if (!kind) throw new Error(`Unknown mappable collection: ${id}`);
  return kind;
};

/** The default example collection. */
export const DEFAULT_KIND_ID = 'landmarks';

const titleCase = (field: string): string =>
  field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');

/** The collection's fields as the options panel sees them. */
export const fieldsFor = (kindId: string = DEFAULT_KIND_ID): CollectionFieldSummary[] => {
  const kind = mappableKind(kindId);
  const firstItem = kind.items[0] ?? {};

  return Object.keys(firstItem).map((field) => ({
    name: titleCase(field),
    field,
    meta: field === kind.geolocationField ? { interface: 'map' } : null,
  }));
};
