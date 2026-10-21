import axios from 'axios';
import {
  apiRequest,
  DIRECTUS_URL,
  type DirectusSingleResponse,
  isDirectusHealthy,
  setAccessToken,
} from '../../tests/helpers/directus-api';
import {
  ensureLprCollection,
  ensureLprMapGrid,
  LPR_COLLECTION,
  LPR_FIELDS,
} from '../../tests/helpers/lpr-collection';
import { waitForCondition } from '../../tests/helpers/wait';
import { DemoAccess } from './demo-access';
import type { DemoSeedOptions, IDemoSeed } from './demo-seed.types';

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

export class DemoSeed implements IDemoSeed {
  constructor(private readonly options: DemoSeedOptions) {}

  async run(): Promise<void> {
    await waitForCondition(isDirectusHealthy, { intervalMs: 2_000, timeoutMs: 300_000 });
    setAccessToken(await signIn(this.options.adminEmail, this.options.adminPassword));

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
    await access.ensureVisitor(role, this.options.visitor);
    await access.presentProject(this.options.visitor);
  }

  async checkReadOnly(): Promise<void> {
    const { email, password } = this.options.visitor;
    const headers = { Authorization: `Bearer ${await signIn(email, password)}` };
    const read = await axios.get(`${DIRECTUS_URL}/items/${LPR_COLLECTION}?limit=1&fields=id`, {
      headers,
    });
    const id = read.data.data[0]?.id;
    if (id == null) throw new Error('The visitor reads no readings.');

    const write = await axios.patch(
      `${DIRECTUS_URL}/items/${LPR_COLLECTION}/${id}`,
      { plate: 'XXX0000' },
      { headers, validateStatus: () => true }
    );
    if (write.status !== 403) throw new Error(`The visitor can write (HTTP ${write.status}).`);

    const anonymous = await axios.get(`${DIRECTUS_URL}/items/${LPR_COLLECTION}?limit=1`, {
      validateStatus: () => true,
    });
    if (anonymous.status !== 403) {
      throw new Error(`Anonymous visitors read the readings (HTTP ${anonymous.status}).`);
    }
  }
}
