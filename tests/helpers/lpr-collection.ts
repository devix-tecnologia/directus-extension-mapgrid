import { grantMissingPublicPermissions } from '../helper-collection';
import {
  apiRequest,
  type DirectusCollectionResponse,
  type DirectusSingleResponse,
  resourceExists,
  unwrapItems,
} from './directus-api';
import { lprPhotoSvg } from './lpr-photo';
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

/** Who read the plate: a pole camera, or one mounted on a patrol car or a bus. */
export type ReaderKind = 'fixed' | 'patrol' | 'bus';

/** Where a plate was read, and by which reader. Mobile readers read wherever they are. */
export interface LprPlace {
  key: string;
  reader: string;
  readerKind: ReaderKind;
  address: string;
  neighbourhood: string;
  municipality: Municipality;
  location: LngLat;
}

/** One vehicle crossing a sequence of places; each reading inherits the trip's alert. */
export interface LprTrip {
  plate: string;
  vehicleType: VehicleType;
  alertStatus: AlertStatus;
  /** The first reading, as an ISO instant. */
  departure: string;
  places: string[];
}

const fixed = (
  label: string,
  address: string,
  neighbourhood: string,
  municipality: Municipality,
  location: LngLat
): LprPlace => ({
  key: label,
  reader: label,
  readerKind: 'fixed',
  address,
  neighbourhood,
  municipality,
  location,
});

const mobile = (
  key: string,
  readerKind: 'patrol' | 'bus',
  address: string,
  neighbourhood: string,
  municipality: Municipality,
  location: LngLat
): LprPlace => ({
  key,
  reader: readerKind === 'patrol' ? 'VTR-1203' : 'BUS-0512',
  readerKind,
  address,
  neighbourhood,
  municipality,
  location,
});

/** Grande Vitória; the coordinates are approximate. */
export const LPR_PLACES: LprPlace[] = [
  fixed('LPR-22265', 'Rod. do Sol', 'Itaparica', 'Vila Velha', [-40.2905, -20.354]),
  fixed('LPR-22283', 'Av. Carlos Lindenberg', 'Glória', 'Vila Velha', [-40.301, -20.338]),
  fixed('LPR-22301', 'Terceira Ponte', 'Praia da Costa', 'Vila Velha', [-40.287, -20.3225]),
  fixed(
    'LPR-23128',
    'Av. Nossa Senhora dos Navegantes',
    'Enseada do Suá',
    'Vitória',
    [-40.293, -20.315]
  ),
  fixed('LPR-23178', 'Av. Reta da Penha', 'Santa Luíza', 'Vitória', [-40.3, -20.301]),
  fixed('LPR-23190', 'Av. Fernando Ferrari', 'Goiabeiras', 'Vitória', [-40.303, -20.277]),
  fixed('LPR-23260', 'Av. Adalberto Simão Nader', 'Mata da Praia', 'Vitória', [-40.285, -20.277]),
  fixed('LPR-23248', 'Av. Dante Michelini', 'Jardim Camburi', 'Vitória', [-40.27, -20.258]),
  fixed('LPR-24010', 'BR-101', 'Carapina', 'Serra', [-40.26, -20.22]),
  fixed('LPR-24035', 'Av. Norte-Sul', 'Laranjeiras', 'Serra', [-40.256, -20.197]),
  fixed('LPR-24052', 'ES-010', 'Manguinhos', 'Serra', [-40.195, -20.19]),
  mobile(
    'henrique-moscoso',
    'patrol',
    'Rua Henrique Moscoso',
    'Centro',
    'Vila Velha',
    [-40.2925, -20.3302]
  ),
  mobile(
    'hugo-musso',
    'bus',
    'Av. Hugo Musso',
    'Praia da Costa',
    'Vila Velha',
    [-40.281, -20.3365]
  ),
  mobile(
    'champagnat',
    'patrol',
    'Av. Champagnat',
    'Praia da Costa',
    'Vila Velha',
    [-40.2848, -20.3318]
  ),
  mobile(
    'jeronimo-monteiro',
    'bus',
    'Av. Jerônimo Monteiro',
    'Centro',
    'Vitória',
    [-40.3378, -20.3195]
  ),
  mobile('cesar-hilal', 'bus', 'Av. César Hilal', 'Bento Ferreira', 'Vitória', [-40.308, -20.3125]),
  mobile(
    'leitao-da-silva',
    'patrol',
    'Av. Leitão da Silva',
    'Santa Lúcia',
    'Vitória',
    [-40.3045, -20.3035]
  ),
  mobile(
    'santos-neves',
    'patrol',
    'Rua Desembargador Santos Neves',
    'Praia do Canto',
    'Vitória',
    [-40.2915, -20.2975]
  ),
  mobile(
    'jardim-da-penha',
    'bus',
    'Av. Fernando Ferrari',
    'Jardim da Penha',
    'Vitória',
    [-40.2945, -20.285]
  ),
  mobile(
    'jardim-limoeiro',
    'patrol',
    'Rod. Norte-Sul',
    'Jardim Limoeiro',
    'Serra',
    [-40.262, -20.205]
  ),
  mobile(
    'eldes-scherrer',
    'bus',
    'Av. Eldes Scherrer Souza',
    'Colina de Laranjeiras',
    'Serra',
    [-40.2465, -20.1985]
  ),
];

/** Minutes from one place to the next along a trip, repeated when the trip is longer. */
const HOP_MINUTES = [6, 5, 9, 4, 7, 5, 6, 8, 5, 7];

const NORTHBOUND = [
  'LPR-22265',
  'LPR-22283',
  'henrique-moscoso',
  'LPR-22301',
  'LPR-23128',
  'santos-neves',
  'LPR-23190',
  'LPR-23248',
];

const NORTHBOUND_BY_THE_BEACH = [
  'LPR-22265',
  'hugo-musso',
  'champagnat',
  'LPR-22301',
  'LPR-23128',
  'cesar-hilal',
  'leitao-da-silva',
  'LPR-23178',
];

const SOUTHBOUND = [
  'LPR-24052',
  'eldes-scherrer',
  'LPR-24035',
  'jardim-limoeiro',
  'LPR-24010',
  'LPR-23248',
  'LPR-23260',
  'jardim-da-penha',
];

const DOWNTOWN = [
  'jeronimo-monteiro',
  'cesar-hilal',
  'LPR-23128',
  'LPR-23178',
  'leitao-da-silva',
  'santos-neves',
  'LPR-23190',
  'LPR-23248',
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
    places: NORTHBOUND,
  },
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'robbery',
    departure: '2026-06-05T19:12:06.000Z',
    places: SOUTHBOUND,
  },
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'restriction',
    departure: '2026-06-10T18:48:38.000Z',
    places: NORTHBOUND_BY_THE_BEACH,
  },
  {
    plate: 'RQP4C58',
    vehicleType: 'car',
    alertStatus: 'monitoring',
    departure: '2026-06-23T19:44:20.000Z',
    places: SOUTHBOUND,
  },
  {
    plate: 'SBC2D19',
    vehicleType: 'bus',
    alertStatus: 'monitoring',
    departure: '2026-06-05T11:05:00.000Z',
    places: DOWNTOWN,
  },
  {
    plate: 'PPX8F41',
    vehicleType: 'truck',
    alertStatus: 'fraud',
    departure: '2026-06-12T09:30:00.000Z',
    places: SOUTHBOUND.slice(0, 6),
  },
  {
    plate: 'QRS5A12',
    vehicleType: 'car',
    alertStatus: 'misappropriation',
    departure: '2026-06-18T22:10:00.000Z',
    places: NORTHBOUND.slice(3),
  },
];

/** The first two readings of the whole collection, by date: the mock-up plate leaving Itaparica. */
export const FIRST_READING_READER = 'LPR-22265';
export const SECOND_READING_READER = 'LPR-22283';

export const placeOf = (key: string): LprPlace => {
  const place = LPR_PLACES.find((candidate) => candidate.key === key);
  if (!place) throw new Error(`Unknown LPR place "${key}"`);
  return place;
};

const minutesAfter = (departure: string, minutes: number): string =>
  new Date(new Date(departure).getTime() + minutes * 60_000).toISOString();

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** The initial great-circle bearing, clockwise from north, in [0, 360). */
export const bearingBetween = (from: LngLat, to: LngLat): number => {
  const [lng1, lat1] = [toRadians(from[0]), toRadians(from[1])];
  const [lng2, lat2] = [toRadians(to[0]), toRadians(to[1])];
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

/** As the trackers send it: past 180° the course comes signed, `-137` instead of `223`. */
const signedCourse = (bearing: number): number => {
  const rounded = Math.round(bearing);
  return rounded > 180 ? rounded - 360 : rounded;
};

export interface LprReading {
  plate: string;
  vehicle_type: VehicleType;
  alert_status: AlertStatus;
  captured_at: string;
  equipment_label: string;
  reader_kind: ReaderKind;
  address: string;
  neighbourhood: string;
  municipality: Municipality;
  course: number;
  location: { type: 'Point'; coordinates: LngLat };
}

const tripReadings = (trip: LprTrip): LprReading[] => {
  let elapsed = 0;
  return trip.places.map((key, index) => {
    if (index > 0) elapsed += HOP_MINUTES[(index - 1) % HOP_MINUTES.length] ?? 5;
    const place = placeOf(key);
    const next = trip.places[index + 1];
    const previous = trip.places[index - 1];
    const course = next
      ? bearingBetween(place.location, placeOf(next).location)
      : previous
        ? bearingBetween(placeOf(previous).location, place.location)
        : 0;

    return {
      plate: trip.plate,
      vehicle_type: trip.vehicleType,
      alert_status: trip.alertStatus,
      captured_at: minutesAfter(trip.departure, elapsed),
      equipment_label: place.reader,
      reader_kind: place.readerKind,
      address: place.address,
      neighbourhood: place.neighbourhood,
      municipality: place.municipality,
      course: signedCourse(course),
      location: { type: 'Point', coordinates: place.location },
    };
  });
};

export const lprReadings = (): LprReading[] => LPR_TRIPS.flatMap(tripReadings);

export const readingsWith = (alertStatus: AlertStatus): number =>
  lprReadings().filter((reading) => reading.alert_status === alertStatus).length;

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

const READER_CHOICES: { text: string; value: ReaderKind }[] = [
  { text: 'Fixed camera', value: 'fixed' },
  { text: 'Patrol car', value: 'patrol' },
  { text: 'Bus', value: 'bus' },
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

const LPR_SCHEMA_FIELDS = [
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
  {
    field: 'reader_kind',
    meta: { interface: 'select-dropdown', options: { choices: READER_CHOICES } },
    schema: {},
    type: 'string',
  },
  textField('address'),
  textField('neighbourhood'),
  textField('municipality'),
  {
    field: 'course',
    meta: { interface: 'input', note: 'Degrees from north' },
    schema: {},
    type: 'integer',
  },
  { field: 'location', meta: { interface: 'map' }, schema: {}, type: 'json' },
];

/** The photo is a file field, so the grid draws a thumbnail and the card can enlarge it. */
const PHOTO_FIELD = {
  field: 'photo',
  meta: { interface: 'file-image', display: 'image', special: ['file'] },
  schema: {},
  type: 'uuid',
};

/** A collection seeded before the photos existed is dropped, not patched: the stack is a test one. */
const isCurrentSchema = (): Promise<boolean> => resourceExists(`/fields/${LPR_COLLECTION}/photo`);

const createCollection = async (): Promise<void> => {
  await apiRequest('POST', '/collections', {
    collection: LPR_COLLECTION,
    fields: LPR_SCHEMA_FIELDS,
    meta: {
      icon: 'photo_camera',
      note: 'Test LPR — plates read by fixed cameras, patrol cars and buses across Grande Vitória',
    },
    schema: {},
  });
  await apiRequest('POST', `/fields/${LPR_COLLECTION}`, PHOTO_FIELD);
  await apiRequest('POST', '/relations', {
    collection: LPR_COLLECTION,
    field: 'photo',
    related_collection: 'directus_files',
    schema: { on_delete: 'SET NULL' },
  });
  await grantMissingPublicPermissions(LPR_COLLECTION);
  await grantPublicPhotoReading();
};

/** Read only: the photos have to load for anyone who can see the readings, nothing more. */
const grantPublicPhotoReading = async (): Promise<void> => {
  const query =
    'filter[collection][_eq]=directus_files&filter[role][_null]=true&filter[action][_eq]=read';
  const existing = unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ id: number }>>('GET', `/permissions?${query}`)
  );
  if (existing.length > 0) return;

  await apiRequest('POST', '/permissions', {
    role: null,
    collection: 'directus_files',
    action: 'read',
    permissions: {},
    fields: ['*'],
  });
};

const uploadPhoto = async (reading: LprReading): Promise<string> => {
  const svg = lprPhotoSvg({
    plate: reading.plate,
    vehicleType: reading.vehicle_type,
    reader: reading.equipment_label,
    capturedAt: `${reading.captured_at.replace('T', ' ').slice(0, 19)} UTC`,
  });
  const form = new FormData();
  form.append('title', `${reading.plate} ${reading.equipment_label} ${reading.captured_at}`);
  form.append('file', new Blob([svg], { type: 'image/svg+xml' }), `${reading.plate}.svg`);

  const response = await apiRequest<DirectusSingleResponse<{ id: string }>>('POST', '/files', form);
  return response.data.id;
};

export async function ensureLprCollection(): Promise<void> {
  if ((await resourceExists(`/collections/${LPR_COLLECTION}`)) && !(await isCurrentSchema())) {
    await deleteAllPresetsFor(LPR_COLLECTION);
    await apiRequest('DELETE', `/collections/${LPR_COLLECTION}`);
  }
  if (!(await resourceExists(`/collections/${LPR_COLLECTION}`))) await createCollection();

  const readings = lprReadings();
  if ((await countReadings()) >= readings.length) return;

  const withPhotos = [];
  for (const reading of readings) {
    withPhotos.push({ ...reading, photo: await uploadPhoto(reading) });
  }
  await apiRequest('POST', `/items/${LPR_COLLECTION}`, withPhotos);
}

export const LPR_FIELDS = [
  'photo',
  'plate',
  'captured_at',
  'alert_status',
  'equipment_label',
  'municipality',
  'neighbourhood',
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
