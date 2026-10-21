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
import { publicScope } from './public-access';

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

/** A text in both languages the extension speaks. */
interface Bilingual {
  en: string;
  pt: string;
}

/**
 * The choices' labels live in `directus_translations`, under these keys, so
 * the badge reads "Furto" for someone using the app in Portuguese and "Theft"
 * otherwise — the stored value stays `theft` either way.
 */
const CHOICE_LABELS: Record<string, Bilingual> = {
  mapgrid_lpr_theft: { en: 'Theft', pt: 'Furto' },
  mapgrid_lpr_robbery: { en: 'Robbery', pt: 'Roubo' },
  mapgrid_lpr_fraud: { en: 'Fraud', pt: 'Estelionato' },
  mapgrid_lpr_misappropriation: { en: 'Misappropriation', pt: 'Apropriação indébita' },
  mapgrid_lpr_restriction: { en: 'Restriction', pt: 'Restrição' },
  mapgrid_lpr_monitoring: { en: 'Monitoring', pt: 'Monitoramento' },
  mapgrid_lpr_car: { en: 'Car', pt: 'Carro' },
  mapgrid_lpr_bus: { en: 'Bus', pt: 'Ônibus' },
  mapgrid_lpr_truck: { en: 'Truck', pt: 'Caminhão' },
  mapgrid_lpr_fixed: { en: 'Fixed camera', pt: 'Câmera fixa' },
  mapgrid_lpr_patrol: { en: 'Patrol car', pt: 'Viatura' },
  mapgrid_lpr_bus_reader: { en: 'Bus', pt: 'Ônibus' },
};

const FIELD_LABELS: Record<string, Bilingual> = {
  photo: { en: 'Photo', pt: 'Foto' },
  plate: { en: 'Plate', pt: 'Placa' },
  captured_at: { en: 'Captured At', pt: 'Data/Hora' },
  alert_status: { en: 'Alert Status', pt: 'Status do alerta' },
  vehicle_type: { en: 'Vehicle Type', pt: 'Tipo de veículo' },
  equipment_label: { en: 'Equipment Label', pt: 'Equip. rótulo' },
  reader_kind: { en: 'Reader Kind', pt: 'Tipo de leitor' },
  address: { en: 'Address', pt: 'Endereço' },
  neighbourhood: { en: 'Neighbourhood', pt: 'Bairro' },
  municipality: { en: 'Municipality', pt: 'Município' },
  course: { en: 'Course', pt: 'Rumo' },
  location: { en: 'Location', pt: 'Localização' },
};

const translationsOf = (field: string) => {
  const label = FIELD_LABELS[field];
  return label
    ? [
        { language: 'en-US', translation: label.en },
        { language: 'pt-BR', translation: label.pt },
      ]
    : null;
};

const choice = <Value extends string>(key: string, value: Value) => ({
  text: `$t:${key}`,
  value,
});

const ALERT_CHOICES = [
  { ...choice('mapgrid_lpr_theft', 'theft'), foreground: '#FFFFFF', background: '#E35169' },
  { ...choice('mapgrid_lpr_robbery', 'robbery'), foreground: '#FFFFFF', background: '#F2802C' },
  { ...choice('mapgrid_lpr_fraud', 'fraud'), foreground: '#FFFFFF', background: '#A855F7' },
  {
    ...choice('mapgrid_lpr_misappropriation', 'misappropriation'),
    foreground: '#FFFFFF',
    background: '#6366F1',
  },
  {
    ...choice('mapgrid_lpr_restriction', 'restriction'),
    foreground: '#1F2937',
    background: '#FACC15',
  },
  {
    ...choice('mapgrid_lpr_monitoring', 'monitoring'),
    foreground: '#FFFFFF',
    background: '#2ECDA7',
  },
];

const VEHICLE_CHOICES = [
  choice('mapgrid_lpr_car', 'car'),
  choice('mapgrid_lpr_bus', 'bus'),
  choice('mapgrid_lpr_truck', 'truck'),
];

const READER_CHOICES = [
  choice('mapgrid_lpr_fixed', 'fixed'),
  choice('mapgrid_lpr_patrol', 'patrol'),
  choice('mapgrid_lpr_bus_reader', 'bus'),
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
  meta: { interface: 'input', translations: translationsOf(field) },
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
    meta: {
      interface: 'datetime',
      display: 'datetime',
      // the same as the card and the timeline: 27/03/2026 10:30:47
      display_options: { format: 'dd/MM/yyyy HH:mm:ss' },
      translations: translationsOf('captured_at'),
    },
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
      translations: translationsOf('alert_status'),
    },
    schema: {},
    type: 'string',
  },
  {
    field: 'vehicle_type',
    meta: {
      interface: 'select-dropdown',
      options: { choices: VEHICLE_CHOICES },
      translations: translationsOf('vehicle_type'),
    },
    schema: {},
    type: 'string',
  },
  textField('equipment_label'),
  {
    field: 'reader_kind',
    meta: {
      interface: 'select-dropdown',
      options: { choices: READER_CHOICES },
      translations: translationsOf('reader_kind'),
    },
    schema: {},
    type: 'string',
  },
  textField('address'),
  textField('neighbourhood'),
  textField('municipality'),
  {
    field: 'course',
    meta: {
      interface: 'input',
      note: 'Degrees from north',
      translations: translationsOf('course'),
    },
    schema: {},
    type: 'integer',
  },
  {
    field: 'location',
    meta: { interface: 'map', translations: translationsOf('location') },
    schema: {},
    type: 'json',
  },
];

/** The photo is a file field, so the grid draws a thumbnail and the card can enlarge it. */
const PHOTO_FIELD = {
  field: 'photo',
  meta: {
    interface: 'file-image',
    display: 'image',
    special: ['file'],
    translations: translationsOf('photo'),
  },
  schema: {},
  type: 'uuid',
};

/**
 * A collection seeded before the photos and the translations existed is
 * dropped, not patched: the stack is a test one.
 */
const isCurrentSchema = async (): Promise<boolean> => {
  if (!(await resourceExists(`/fields/${LPR_COLLECTION}/photo`))) return false;
  const plate = await apiRequest<DirectusSingleResponse<{ meta?: { translations?: unknown } }>>(
    'GET',
    `/fields/${LPR_COLLECTION}/plate`
  );
  return Array.isArray(plate.data.meta?.translations);
};

/** A stack seeded before the date pattern existed gets it here; on a fresh one it is a no-op. */
const ensureDateTimeDisplay = async (): Promise<void> => {
  await apiRequest('PATCH', `/fields/${LPR_COLLECTION}/captured_at`, {
    meta: { display: 'datetime', display_options: { format: 'dd/MM/yyyy HH:mm:ss' } },
  });
};

/** Adds the choice labels that are missing; the ones already there are left as they are. */
const ensureChoiceLabels = async (): Promise<void> => {
  const existing = unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ key: string; language: string }>>(
      'GET',
      '/translations?filter[key][_starts_with]=mapgrid_lpr_&fields=key,language&limit=-1'
    )
  );
  const known = new Set(existing.map((row) => `${row.language}:${row.key}`));
  const missing = Object.entries(CHOICE_LABELS).flatMap(([key, label]) =>
    [
      { language: 'en-US', key, value: label.en },
      { language: 'pt-BR', key, value: label.pt },
    ].filter((row) => !known.has(`${row.language}:${row.key}`))
  );
  if (missing.length > 0) await apiRequest('POST', '/translations', missing);
};

const createCollection = async (): Promise<void> => {
  await apiRequest('POST', '/collections', {
    collection: LPR_COLLECTION,
    fields: LPR_SCHEMA_FIELDS,
    meta: {
      icon: 'photo_camera',
      note: 'Test LPR — plates read by fixed cameras, patrol cars and buses across Grande Vitória',
      translations: [
        { language: 'en-US', translation: 'Test LPR', singular: 'Reading', plural: 'Readings' },
        {
          language: 'pt-BR',
          translation: 'Leituras de placas (LPR)',
          singular: 'Leitura',
          plural: 'Leituras',
        },
      ],
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
  const { filter, owner } = await publicScope();
  const query = `filter[collection][_eq]=directus_files&${filter}&filter[action][_eq]=read&fields=id,action`;
  const existing = unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ id: number }>>('GET', `/permissions?${query}`)
  );
  if (existing.length > 0) return;

  await apiRequest('POST', '/permissions', {
    ...owner,
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
  await ensureChoiceLabels();
  await ensureDateTimeDisplay();

  const readings = lprReadings();
  if ((await countReadings()) >= readings.length) return;

  const withPhotos = [];
  for (const reading of readings) {
    withPhotos.push({ ...reading, photo: await uploadPhoto(reading) });
  }
  await apiRequest('POST', `/items/${LPR_COLLECTION}`, withPhotos);
}

/** The language the admin uses the app in; the evidence and the hand-run stack are in Portuguese. */
export async function setAdminLanguage(language: 'en-US' | 'pt-BR'): Promise<void> {
  await apiRequest('PATCH', '/users/me', { language });
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
        zoomOnClick: false,
        ...overrides.options,
        // a date to the second needs more than the 160px Directus gives a column
        tabular: {
          widths: { captured_at: 200 },
          ...(overrides.options?.tabular as Record<string, unknown> | undefined),
        },
        // merged, not replaced: a preset that only sets the camera kept losing the
        // popup's template, and the popup fell back to the record's id
        map: {
          geometryField: 'location',
          displayTemplate: '{{plate}} · {{equipment_label}} · {{alert_status}}',
          ...(overrides.options?.map as Record<string, unknown> | undefined),
        },
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
