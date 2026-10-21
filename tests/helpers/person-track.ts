import { grantMissingPublicPermissions } from '../helper-collection';
import {
  apiRequest,
  type DirectusCollectionResponse,
  resourceExists,
  unwrapItems,
} from './directus-api';
import { deleteAllPresetsFor } from './mapgrid-preset';

export const PERSON_TRACK_COLLECTION = 'test_mapgrid_person_track';

type LngLat = [number, number];

export interface PersonTrackRoute {
  person: string;
  label: string;
  /** The moment the route starts, as an ISO instant; each point follows at a fixed interval. */
  departure: string;
  points: LngLat[];
}

export const CAPTURE_INTERVAL_SECONDS = 15;

const capturedAt = (departure: string, index: number): string => {
  const moment = new Date(departure);
  moment.setUTCSeconds(moment.getUTCSeconds() + index * CAPTURE_INTERVAL_SECONDS);
  return moment.toISOString();
};

/*
 * Five people crossing the streets of Vitória, each on a route of its own,
 * drawn for the demo over the real neighbourhoods. The coordinates reference
 * the itineraries in the mobigv project (public bus routes); they follow the
 * streets approximately, not exactly.
 */
export const PERSON_TRACK_ROUTES: PersonTrackRoute[] = [
  {
    person: 'Ana',
    label: 'Goiabeiras → Centro',
    departure: '2026-09-25T07:00:00.000Z',
    points: [
      [-40.3027, -20.2768],
      [-40.3029, -20.2783],
      [-40.3031, -20.2798],
      [-40.3034, -20.2813],
      [-40.3037, -20.2828],
      [-40.3041, -20.2843],
      [-40.3045, -20.2858],
      [-40.305, -20.2873],
      [-40.3056, -20.2888],
      [-40.3063, -20.2902],
      [-40.3071, -20.2916],
      [-40.308, -20.293],
      [-40.309, -20.2943],
      [-40.3101, -20.2956],
      [-40.3113, -20.2968],
      [-40.3126, -20.298],
      [-40.314, -20.2992],
      [-40.3155, -20.3003],
      [-40.3171, -20.3014],
      [-40.3188, -20.3024],
    ],
  },
  {
    person: 'Bruno',
    label: 'Jardim da Penha → Praia do Canto',
    departure: '2026-09-25T07:08:00.000Z',
    points: [
      [-40.3088, -20.2768],
      [-40.3089, -20.2784],
      [-40.309, -20.28],
      [-40.3091, -20.2816],
      [-40.3092, -20.2832],
      [-40.3093, -20.2848],
      [-40.3094, -20.2864],
      [-40.3095, -20.288],
      [-40.3096, -20.2896],
      [-40.3097, -20.2912],
      [-40.3098, -20.2928],
      [-40.3099, -20.2944],
      [-40.31, -20.296],
      [-40.3101, -20.2976],
      [-40.3102, -20.2992],
      [-40.3103, -20.3008],
      [-40.3104, -20.3024],
      [-40.3105, -20.304],
      [-40.3106, -20.3056],
      [-40.3107, -20.3072],
    ],
  },
  {
    person: 'Carla',
    label: 'Praia do Canto → Shopping Vitória',
    departure: '2026-09-25T07:15:00.000Z',
    points: [
      [-40.2898, -20.3076],
      [-40.2909, -20.3078],
      [-40.292, -20.308],
      [-40.2931, -20.3082],
      [-40.2942, -20.3084],
      [-40.2953, -20.3086],
      [-40.2964, -20.3088],
      [-40.2975, -20.309],
      [-40.2986, -20.3092],
      [-40.2997, -20.3094],
      [-40.3008, -20.3096],
      [-40.3019, -20.3098],
      [-40.303, -20.31],
      [-40.3041, -20.3102],
      [-40.3044, -20.3113],
      [-40.3036, -20.3124],
      [-40.3023, -20.313],
      [-40.3008, -20.313],
      [-40.2994, -20.3124],
      [-40.2987, -20.3112],
    ],
  },
  {
    person: 'Diego',
    label: 'Centro → Maruípe',
    departure: '2026-09-25T07:22:00.000Z',
    points: [
      [-40.3379, -20.3196],
      [-40.3368, -20.3186],
      [-40.3357, -20.3176],
      [-40.3346, -20.3166],
      [-40.3335, -20.3156],
      [-40.3324, -20.3146],
      [-40.3313, -20.3136],
      [-40.3302, -20.3126],
      [-40.3291, -20.3116],
      [-40.328, -20.3106],
      [-40.3269, -20.3096],
      [-40.3258, -20.3086],
      [-40.3247, -20.3076],
      [-40.3236, -20.3066],
      [-40.3225, -20.3056],
      [-40.3214, -20.3046],
      [-40.3203, -20.3036],
      [-40.3192, -20.3026],
      [-40.3181, -20.3016],
      [-40.317, -20.3006],
    ],
  },
  {
    person: 'Elisa',
    label: 'Jardim Camburi → Mata da Praia',
    departure: '2026-09-25T07:30:00.000Z',
    points: [
      [-40.287, -20.2675],
      [-40.2862, -20.2666],
      [-40.2854, -20.2657],
      [-40.2846, -20.2648],
      [-40.2838, -20.2639],
      [-40.283, -20.263],
      [-40.2822, -20.2621],
      [-40.2814, -20.2612],
      [-40.2806, -20.2603],
      [-40.2798, -20.2594],
      [-40.279, -20.2585],
      [-40.2782, -20.2576],
      [-40.2774, -20.2567],
      [-40.2766, -20.2558],
      [-40.2758, -20.2549],
      [-40.275, -20.254],
      [-40.2742, -20.2531],
      [-40.2734, -20.2522],
      [-40.2726, -20.2513],
      [-40.2718, -20.2504],
    ],
  },
];

const personTrackItems = (): Record<string, unknown>[] =>
  PERSON_TRACK_ROUTES.flatMap((route) =>
    route.points.map((coordinates, index) => ({
      person: route.person,
      name: route.label,
      sequence: index + 1,
      captured_at: capturedAt(route.departure, index),
      location: { type: 'Point', coordinates },
    }))
  );

const countPersonTrackItems = async (): Promise<number> => {
  const response = await apiRequest<DirectusCollectionResponse<{ id: number }>>(
    'GET',
    `/items/${PERSON_TRACK_COLLECTION}?fields=id&limit=-1`
  );
  return unwrapItems(response).length;
};

export async function ensurePersonTrack(): Promise<void> {
  if (!(await resourceExists(`/collections/${PERSON_TRACK_COLLECTION}`))) {
    await apiRequest('POST', '/collections', {
      collection: PERSON_TRACK_COLLECTION,
      fields: [
        {
          field: 'id',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { has_auto_increment: true, is_primary_key: true },
          type: 'integer',
        },
        {
          field: 'person',
          meta: { interface: 'input' },
          schema: { is_nullable: false },
          type: 'string',
        },
        { field: 'name', meta: { interface: 'input' }, schema: {}, type: 'string' },
        { field: 'sequence', meta: { interface: 'input' }, schema: {}, type: 'integer' },
        { field: 'captured_at', meta: { interface: 'datetime' }, schema: {}, type: 'timestamp' },
        {
          field: 'location',
          meta: { interface: 'map' },
          schema: { is_nullable: true },
          type: 'json',
        },
      ],
      meta: {
        icon: 'map',
        note: 'Test Person Track — five people crossing the streets of Vitória',
      },
      schema: {},
    });
    await grantMissingPublicPermissions(PERSON_TRACK_COLLECTION);
  }

  if ((await countPersonTrackItems()) >= personTrackItems().length) return;

  await apiRequest('POST', `/items/${PERSON_TRACK_COLLECTION}`, personTrackItems());
}

/** The MapGrid over the five routes, ordered by person then by the point along the route. */
export async function ensurePersonTrackMapGrid(): Promise<void> {
  await deleteAllPresetsFor(PERSON_TRACK_COLLECTION);
  await apiRequest('POST', '/presets', {
    collection: PERSON_TRACK_COLLECTION,
    layout: 'mapgrid',
    layout_options: {
      mapgrid: { map: { geometryField: 'location' }, zoomOnClick: false },
    },
    layout_query: {
      mapgrid: {
        fields: ['person', 'name', 'sequence', 'captured_at'],
        limit: 25,
        page: 1,
        sort: ['person', 'sequence'],
      },
    },
  });
}
