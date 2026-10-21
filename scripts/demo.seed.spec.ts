import axios from 'axios';
import { expect, it } from 'vitest';
import {
  apiRequest,
  DIRECTUS_URL,
  type DirectusSingleResponse,
  isDirectusHealthy,
  setAccessToken,
} from '../tests/helpers/directus-api';
import {
  ensureLprCollection,
  ensureLprMapGrid,
  LPR_COLLECTION,
  LPR_FIELDS,
} from '../tests/helpers/lpr-collection';
import { waitForCondition } from '../tests/helpers/wait';
import { DemoAccess, type DemoVisitor } from './demo/index';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const visitor: DemoVisitor = {
  email: process.env.DEMO_USER_EMAIL || 'visitante@demo.devix.co',
  password: process.env.DEMO_USER_PASSWORD || 'mapgrid-demo',
};

/** Grande Vitória, where the readings are. */
const CAMERA = { center: [-40.29, -20.29], zoom: 11 };

const signIn = async (email: string, password: string): Promise<string> => {
  const session = await apiRequest<DirectusSingleResponse<{ access_token: string }>>(
    'POST',
    '/auth/login',
    { email, password }
  );
  return session.data.access_token;
};

it('seeds the demo and leaves it read-only', async () => {
  await waitForCondition(isDirectusHealthy, { intervalMs: 2_000, timeoutMs: 180_000 });
  setAccessToken(
    await signIn(
      process.env.DEMO_ADMIN_EMAIL || 'admin@demo.devix.co',
      required('DEMO_ADMIN_PASSWORD')
    )
  );

  await ensureLprCollection();
  // every feature on, and the tour on the first visit: this layout is what the demo is for
  await ensureLprMapGrid({
    options: {
      map: { geometryField: 'location', cameraOptions: CAMERA },
      cameraTracking: 'follow',
      headingSource: 'computed',
      trailLength: 20,
      showCard: true,
      cardImageField: 'photo',
      cardFields: [
        'plate',
        'captured_at',
        'alert_status',
        'vehicle_type',
        'equipment_label',
        'reader_kind',
        'address',
        'neighbourhood',
        'municipality',
      ],
      playbackTiming: 'realtime',
      playbackSpeed: 60,
      tourOnFirstVisit: true,
    },
    query: { fields: LPR_FIELDS },
  });

  const access = new DemoAccess();
  await access.closePublicAccess([LPR_COLLECTION]);
  const role = await access.ensureRole([LPR_COLLECTION]);
  await access.ensureVisitor(role, visitor);
  await access.presentProject(visitor);

  // the proof that it is read-only: the visitor reads, and a write is refused
  const token = await signIn(visitor.email, visitor.password);
  const headers = { Authorization: `Bearer ${token}` };
  const read = await axios.get(`${DIRECTUS_URL}/items/${LPR_COLLECTION}?limit=1&fields=id`, {
    headers,
  });
  expect(read.data.data).toHaveLength(1);
  const id = read.data.data[0].id;

  const write = await axios.patch(
    `${DIRECTUS_URL}/items/${LPR_COLLECTION}/${id}`,
    { plate: 'XXX0000' },
    { headers, validateStatus: () => true }
  );
  expect(write.status).toBe(403);

  const anonymous = await axios.get(`${DIRECTUS_URL}/items/${LPR_COLLECTION}?limit=1`, {
    validateStatus: () => true,
  });
  expect(anonymous.status).toBe(403);
});
