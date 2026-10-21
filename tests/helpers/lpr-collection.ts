import { grantMissingPublicPermissions } from '../helper-collection';
import {
  apiRequest,
  type DirectusCollectionResponse,
  resourceExists,
  unwrapItems,
} from './directus-api';
import { deleteAllPresetsFor } from './mapgrid-preset';

export const LPR_COLLECTION = 'test_mapgrid_lpr';

type LngLat = [number, number];

export type AlertStatus =
  | 'theft'
  | 'robbery'
  | 'fraud'
  | 'misappropriation'
  | 'restriction'
  | 'monitoring';

export type VehicleType = 'car' | 'bus' | 'truck';

export type Municipality = 'Vitória' | 'Vila Velha' | 'Serra';

/** A licence plate recognition camera, fixed on a street. */
export interface LprCamera {
  label: string;
  address: string;
  neighbourhood: string;
  municipality: Municipality;
  location: LngLat;
}

/** One vehicle crossing a sequence of cameras; each reading inherits the trip's alert. */
export interface LprTrip {
  plate: string;
  vehicleType: VehicleType;
  alertStatus: AlertStatus;
  /** The first reading, as an ISO instant. */
  departure: string;
  cameras: string[];
}

/** Eleven cameras across Grande Vitória; the coordinates are approximate. */
export const LPR_CAMERAS: LprCamera[] = [
  {
    label: 'LPR-22265',
    address: 'Rod. do Sol',
    neighbourhood: 'Itaparica',
    municipality: 'Vila Velha',
    location: [-40.2905, -20.354],
  },
  {
    label: 'LPR-22283',
    address: 'Av. Carlos Lindenberg',
    neighbourhood: 'Glória',
    municipality: 'Vila Velha',
    location: [-40.301, -20.338],
  },
  {
    label: 'LPR-22301',
    address: 'Terceira Ponte',
    neighbourhood: 'Praia da Costa',
    municipality: 'Vila Velha',
    location: [-40.287, -20.3225],
  },
  {
    label: 'LPR-23128',
    address: 'Av. Nossa Senhora dos Navegantes',
    neighbourhood: 'Enseada do Suá',
    municipality: 'Vitória',
    location: [-40.293, -20.315],
  },
  {
    label: 'LPR-23178',
    address: 'Av. Reta da Penha',
    neighbourhood: 'Santa Luíza',
    municipality: 'Vitória',
    location: [-40.3, -20.301],
  },
  {
    label: 'LPR-23190',
    address: 'Av. Fernando Ferrari',
    neighbourhood: 'Goiabeiras',
    municipality: 'Vitória',
    location: [-40.303, -20.277],
  },
  {
    label: 'LPR-23260',
    address: 'Av. Adalberto Simão Nader',
    neighbourhood: 'Mata da Praia',
    municipality: 'Vitória',
    location: [-40.285, -20.277],
  },
  {
    label: 'LPR-23248',
    address: 'Av. Dante Michelini',
    neighbourhood: 'Jardim Camburi',
    municipality: 'Vitória',
    location: [-40.27, -20.258],
  },
  {
    label: 'LPR-24010',
    address: 'BR-101',
    neighbourhood: 'Carapina',
    municipality: 'Serra',
    location: [-40.26, -20.22],
  },
  {
    label: 'LPR-24035',
    address: 'Av. Norte-Sul',
    neighbourhood: 'Laranjeiras',
    municipality: 'Serra',
    location: [-40.256, -20.197],
  },
  {
    label: 'LPR-24052',
    address: 'ES-010',
    neighbourhood: 'Manguinhos',
    municipality: 'Serra',
    location: [-40.195, -20.19],
  },
];

/** Minutes from one camera to the next along a trip, repeated when the trip is longer. */
const HOP_MINUTES = [6, 5, 9, 4, 7, 5, 6, 8, 5, 7];

const NORTHBOUND = [
  'LPR-22265',
  'LPR-22283',
  'LPR-22301',
  'LPR-23128',
  'LPR-23178',
  'LPR-23190',
  'LPR-23260',
  'LPR-23248',
];

const SOUTHBOUND = [
  'LPR-24052',
  'LPR-24035',
  'LPR-24010',
  'LPR-23248',
  'LPR-23260',
  'LPR-23190',
  'LPR-23178',
  'LPR-23128',
];

/**
 * The plate of the document's mock-up, read 32 times in four trips across three
 * municipalities, and three other vehicles so the filters have something to leave out.
 */
export const LPR_TRIPS: LprTrip[] = [
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'theft',
    departure: '2026-05-27T17:23:55.000Z',
    cameras: NORTHBOUND,
  },
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'robbery',
    departure: '2026-06-05T19:12:06.000Z',
    cameras: SOUTHBOUND,
  },
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'restriction',
    departure: '2026-06-10T18:48:38.000Z',
    cameras: NORTHBOUND,
  },
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'monitoring',
    departure: '2026-06-23T19:44:20.000Z',
    cameras: SOUTHBOUND,
  },
  {
    plate: 'SBC2D19',
    vehicleType: 'bus',
    alertStatus: 'monitoring',
    departure: '2026-06-05T11:05:00.000Z',
    cameras: NORTHBOUND,
  },
  {
    plate: 'PPX8F41',
    vehicleType: 'truck',
    alertStatus: 'fraud',
    departure: '2026-06-12T09:30:00.000Z',
    cameras: SOUTHBOUND.slice(0, 6),
  },
  {
    plate: 'QRS5A12',
    vehicleType: 'car',
    alertStatus: 'misappropriation',
    departure: '2026-06-18T22:10:00.000Z',
    cameras: NORTHBOUND.slice(3),
  },
];

/** The first reading of the whole collection, by date: the mock-up plate leaving Itaparica. */
export const FIRST_READING_CAMERA = 'LPR-22265';
export const SECOND_READING_CAMERA = 'LPR-22283';

const cameraOf = (label: string): LprCamera => {
  const camera = LPR_CAMERAS.find((candidate) => candidate.label === label);
  if (!camera) throw new Error(`Unknown LPR camera "${label}"`);
  return camera;
};

const minutesAfter = (departure: string, minutes: number): string =>
  new Date(new Date(departure).getTime() + minutes * 60_000).toISOString();

const tripReadings = (trip: LprTrip): Record<string, unknown>[] => {
  let elapsed = 0;
  return trip.cameras.map((label, index) => {
    if (index > 0) elapsed += HOP_MINUTES[(index - 1) % HOP_MINUTES.length] ?? 5;
    const camera = cameraOf(label);
    return {
      plate: trip.plate,
      vehicle_type: trip.vehicleType,
      alert_status: trip.alertStatus,
      captured_at: minutesAfter(trip.departure, elapsed),
      equipment_label: camera.label,
      address: camera.address,
      neighbourhood: camera.neighbourhood,
      municipality: camera.municipality,
      location: { type: 'Point', coordinates: camera.location },
    };
  });
};

export const lprReadings = (): Record<string, unknown>[] => LPR_TRIPS.flatMap(tripReadings);

export const readingsWith = (alertStatus: AlertStatus): number =>
  LPR_TRIPS.filter((trip) => trip.alertStatus === alertStatus).reduce(
    (total, trip) => total + trip.cameras.length,
    0
  );

const ALERT_CHOICES: {
  text: string;
  value: AlertStatus;
  foreground: string;
  background: string;
}[] = [
  { text: 'Theft', value: 'theft', foreground: '#FFFFFF', background: '#E35169' },
  { text: 'Robbery', value: 'robbery', foreground: '#FFFFFF', background: '#F2802C' },
  { text: 'Fraud', value: 'fraud', foreground: '#FFFFFF', background: '#A855F7' },
  {
    text: 'Misappropriation',
    value: 'misappropriation',
    foreground: '#FFFFFF',
    background: '#6366F1',
  },
  { text: 'Restriction', value: 'restriction', foreground: '#1F2937', background: '#FACC15' },
  { text: 'Monitoring', value: 'monitoring', foreground: '#FFFFFF', background: '#2ECDA7' },
];

const VEHICLE_CHOICES: { text: string; value: VehicleType }[] = [
  { text: 'Car', value: 'car' },
  { text: 'Bus', value: 'bus' },
  { text: 'Truck', value: 'truck' },
];

const countReadings = async (): Promise<number> => {
  const response = await apiRequest<DirectusCollectionResponse<{ id: number }>>(
    'GET',
    `/items/${LPR_COLLECTION}?fields=id&limit=-1`
  );
  return unwrapItems(response).length;
};

const textField = (field: string) => ({
  field,
  meta: { interface: 'input' },
  schema: {},
  type: 'string',
});

/** The geometry is `json`, as in the person track: a native one makes the map filter by the visible area. */
export async function ensureLprCollection(): Promise<void> {
  if (!(await resourceExists(`/collections/${LPR_COLLECTION}`))) {
    await apiRequest('POST', '/collections', {
      collection: LPR_COLLECTION,
      fields: [
        {
          field: 'id',
          meta: { hidden: true, interface: 'input', readonly: true },
          schema: { has_auto_increment: true, is_primary_key: true },
          type: 'integer',
        },
        { ...textField('plate'), schema: { is_nullable: false } },
        {
          field: 'captured_at',
          meta: { interface: 'datetime', display: 'datetime' },
          schema: {},
          type: 'timestamp',
        },
        {
          field: 'alert_status',
          meta: {
            interface: 'select-dropdown',
            options: { choices: ALERT_CHOICES },
            display: 'labels',
            display_options: { choices: ALERT_CHOICES },
          },
          schema: {},
          type: 'string',
        },
        {
          field: 'vehicle_type',
          meta: { interface: 'select-dropdown', options: { choices: VEHICLE_CHOICES } },
          schema: {},
          type: 'string',
        },
        textField('equipment_label'),
        textField('address'),
        textField('neighbourhood'),
        textField('municipality'),
        { field: 'location', meta: { interface: 'map' }, schema: {}, type: 'json' },
      ],
      meta: {
        icon: 'photo_camera',
        note: 'Test LPR — licence plate readings across Grande Vitória',
      },
      schema: {},
    });
    await grantMissingPublicPermissions(LPR_COLLECTION);
  }

  if ((await countReadings()) >= lprReadings().length) return;

  await apiRequest('POST', `/items/${LPR_COLLECTION}`, lprReadings());
}

export const LPR_FIELDS = [
  'plate',
  'captured_at',
  'alert_status',
  'municipality',
  'neighbourhood',
  'equipment_label',
];

/**
 * The MapGrid over the readings, in the order they happened. `query` overrides
 * the layout query, `filter` is the preset's own filter, as the sidebar writes it.
 */
export async function ensureLprMapGrid(
  overrides: {
    options?: Record<string, unknown>;
    query?: Record<string, unknown>;
    filter?: Record<string, unknown>;
  } = {}
): Promise<void> {
  await deleteAllPresetsFor(LPR_COLLECTION);
  await apiRequest('POST', '/presets', {
    collection: LPR_COLLECTION,
    layout: 'mapgrid',
    filter: overrides.filter ?? null,
    layout_options: {
      mapgrid: {
        map: {
          geometryField: 'location',
          displayTemplate: '{{plate}} · {{equipment_label}} · {{alert_status}}',
        },
        zoomOnClick: false,
        ...overrides.options,
      },
    },
    layout_query: {
      mapgrid: {
        fields: LPR_FIELDS,
        limit: 25,
        page: 1,
        sort: ['captured_at'],
        ...overrides.query,
      },
    },
  });
}
