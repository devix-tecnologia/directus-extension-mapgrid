/**
 * Smartphones tracked on the map, in the shape of the GeoHub's: the positions
 * point to the device, and the device carries the brand, the model and an icon.
 * It is what shows that the MapGrid reads a field one relation away — the
 * card's picture is `smartphone.icon`.
 */
import { grantMissingPublicPermissions } from '../helper-collection';
import {
  apiRequest,
  type DirectusCollectionResponse,
  type DirectusSingleResponse,
  resourceExists,
  unwrapItems,
} from './directus-api';
import { grantPublicPhotoReading } from './lpr-collection';
import { deleteAllPresetsFor } from './mapgrid-preset';

export const SMARTPHONES_COLLECTION = 'test_mapgrid_smartphones';
export const TRACKING_COLLECTION = 'test_mapgrid_smartphone_tracking';

type LngLat = [number, number];

export interface Smartphone {
  brand: string;
  model: string;
  colour: string;
  route: LngLat[];
}

/** Three devices, each with a short trip across Vitória. */
export const SMARTPHONES: Smartphone[] = [
  {
    brand: 'Motorola',
    model: 'Moto G54',
    colour: '#1D4ED8',
    route: [
      [-40.2963, -20.3194],
      [-40.2921, -20.3156],
      [-40.2878, -20.3121],
      [-40.2832, -20.3089],
      [-40.2789, -20.3052],
      [-40.2745, -20.3017],
    ],
  },
  {
    brand: 'Samsung',
    model: 'Galaxy A15',
    colour: '#0F766E',
    route: [
      [-40.3381, -20.3243],
      [-40.3332, -20.3217],
      [-40.3279, -20.3196],
      [-40.3225, -20.3178],
      [-40.3171, -20.3161],
      [-40.3118, -20.3149],
    ],
  },
  {
    brand: 'Xiaomi',
    model: 'Redmi Note 13',
    colour: '#C2410C',
    route: [
      [-40.2896, -20.3398],
      [-40.2902, -20.3352],
      [-40.2911, -20.3306],
      [-40.2925, -20.3261],
      [-40.2938, -20.3215],
      [-40.2954, -20.317],
    ],
  },
];

const TRIP_START = Date.parse('2026-06-10T13:00:00Z');
const STEP_MS = 2 * 60 * 1000;

export interface TrackingPoint {
  smartphone: number;
  location: { type: 'Point'; coordinates: LngLat };
  tracked_at: string;
  battery_percent: number;
  speed_kmh: number;
  accuracy_m: number;
}

/** The positions, device by device; `smartphone` is the device's id once created. */
export const trackingPoints = (ids: readonly number[]): TrackingPoint[] =>
  SMARTPHONES.flatMap((phone, device) =>
    phone.route.map((coordinates, step) => ({
      smartphone: ids[device] as number,
      location: { type: 'Point' as const, coordinates },
      tracked_at: new Date(TRIP_START + device * STEP_MS * 10 + step * STEP_MS).toISOString(),
      battery_percent: 90 - device * 15 - step * 2,
      speed_kmh: 20 + ((device * 7 + step * 5) % 30),
      accuracy_m: 5 + ((device + step) % 4) * 3,
    }))
  );

/** A phone drawn as SVG: no binary fixtures, and each brand recognisable by colour and initial. */
export const smartphoneIconSvg = ({ brand, model, colour }: Smartphone): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#F1F5F9"/>
  <rect x="100" y="30" width="120" height="240" rx="22" fill="${colour}"/>
  <rect x="112" y="56" width="96" height="176" rx="6" fill="#E2E8F0"/>
  <circle cx="160" cy="251" r="8" fill="#E2E8F0"/>
  <text x="160" y="160" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="${colour}" text-anchor="middle">${brand[0]}</text>
  <text x="160" y="300" font-family="Arial, sans-serif" font-size="20" fill="#0F172A" text-anchor="middle">${brand} ${model}</text>
</svg>`;

const ID_FIELD = {
  field: 'id',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { has_auto_increment: true, is_primary_key: true },
  type: 'integer',
};

const SMARTPHONE_FIELDS = [
  ID_FIELD,
  { field: 'brand', meta: { interface: 'input' }, schema: {}, type: 'string' },
  { field: 'model', meta: { interface: 'input' }, schema: {}, type: 'string' },
];

const ICON_FIELD = {
  field: 'icon',
  meta: { interface: 'file-image', display: 'image', special: ['file'] },
  schema: {},
  type: 'uuid',
};

const TRACKING_FIELDS = [
  ID_FIELD,
  {
    field: 'location',
    meta: { interface: 'map', options: { geometryType: 'Point' } },
    schema: {},
    type: 'geometry.Point',
  },
  {
    field: 'tracked_at',
    meta: {
      interface: 'datetime',
      display: 'datetime',
      display_options: { format: 'dd/MM/yyyy HH:mm:ss' },
    },
    schema: {},
    type: 'timestamp',
  },
  { field: 'battery_percent', meta: { interface: 'input' }, schema: {}, type: 'integer' },
  { field: 'speed_kmh', meta: { interface: 'input' }, schema: {}, type: 'float' },
  { field: 'accuracy_m', meta: { interface: 'input' }, schema: {}, type: 'float' },
];

const SMARTPHONE_FIELD = {
  field: 'smartphone',
  meta: {
    interface: 'select-dropdown-m2o',
    display: 'related-values',
    display_options: { template: '{{brand}} {{model}}' },
    options: { template: '{{brand}} {{model}}' },
    special: ['m2o'],
  },
  schema: {},
  type: 'integer',
};

const createCollections = async (): Promise<void> => {
  await apiRequest('POST', '/collections', {
    collection: SMARTPHONES_COLLECTION,
    fields: SMARTPHONE_FIELDS,
    meta: { icon: 'smartphone', display_template: '{{brand}} {{model}}' },
    schema: {},
  });
  await apiRequest('POST', `/fields/${SMARTPHONES_COLLECTION}`, ICON_FIELD);
  await apiRequest('POST', '/relations', {
    collection: SMARTPHONES_COLLECTION,
    field: 'icon',
    related_collection: 'directus_files',
    schema: { on_delete: 'SET NULL' },
  });

  await apiRequest('POST', '/collections', {
    collection: TRACKING_COLLECTION,
    fields: TRACKING_FIELDS,
    meta: { icon: 'share_location', note: 'Test smartphone tracking — positions of each device' },
    schema: {},
  });
  await apiRequest('POST', `/fields/${TRACKING_COLLECTION}`, SMARTPHONE_FIELD);
  await apiRequest('POST', '/relations', {
    collection: TRACKING_COLLECTION,
    field: 'smartphone',
    related_collection: SMARTPHONES_COLLECTION,
    schema: { on_delete: 'SET NULL' },
  });

  await grantMissingPublicPermissions(SMARTPHONES_COLLECTION);
  await grantMissingPublicPermissions(TRACKING_COLLECTION);
  await grantPublicPhotoReading();
};

const uploadIcon = async (phone: Smartphone): Promise<string> => {
  const form = new FormData();
  form.append('title', `${phone.brand} ${phone.model}`);
  form.append(
    'file',
    new Blob([smartphoneIconSvg(phone)], { type: 'image/svg+xml' }),
    `${phone.brand}-${phone.model}.svg`.replace(/\s+/g, '-')
  );
  const response = await apiRequest<DirectusSingleResponse<{ id: string }>>('POST', '/files', form);
  return response.data.id;
};

const idsOf = async (collection: string): Promise<number[]> =>
  unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ id: number }>>(
      'GET',
      `/items/${collection}?fields=id&sort=id&limit=-1`
    )
  ).map((row) => row.id);

export async function ensureSmartphoneCollections(): Promise<void> {
  if (!(await resourceExists(`/collections/${SMARTPHONES_COLLECTION}`))) await createCollections();

  let phones = await idsOf(SMARTPHONES_COLLECTION);
  if (phones.length < SMARTPHONES.length) {
    const rows = [];
    for (const phone of SMARTPHONES) {
      rows.push({ brand: phone.brand, model: phone.model, icon: await uploadIcon(phone) });
    }
    await apiRequest('POST', `/items/${SMARTPHONES_COLLECTION}`, rows);
    phones = await idsOf(SMARTPHONES_COLLECTION);
  }

  const points = trackingPoints(phones);
  if ((await idsOf(TRACKING_COLLECTION)).length < points.length) {
    await apiRequest('POST', `/items/${TRACKING_COLLECTION}`, points);
  }
}

/** The grid's columns: two of them come from the device, one relation away. */
export const TRACKING_FIELDS_SHOWN = [
  'smartphone.brand',
  'smartphone.model',
  'tracked_at',
  'battery_percent',
  'speed_kmh',
];

/** The MapGrid over the positions, in the order they happened, with the device's icon on the card. */
export async function ensureSmartphoneMapGrid(
  overrides: { options?: Record<string, unknown>; query?: Record<string, unknown> } = {}
): Promise<void> {
  await deleteAllPresetsFor(TRACKING_COLLECTION);
  await apiRequest('POST', '/presets', {
    collection: TRACKING_COLLECTION,
    layout: 'mapgrid',
    layout_options: {
      mapgrid: {
        zoomOnClick: false,
        showCard: true,
        cardImageField: 'smartphone.icon',
        cardFields: TRACKING_FIELDS_SHOWN,
        ...overrides.options,
        map: {
          geometryField: 'location',
          ...(overrides.options?.map as Record<string, unknown> | undefined),
        },
      },
    },
    layout_query: {
      mapgrid: {
        fields: TRACKING_FIELDS_SHOWN,
        limit: 25,
        page: 1,
        sort: ['tracked_at'],
        ...overrides.query,
      },
    },
  });
}
