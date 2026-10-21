import {
  COLLECTION_NAME,
  EMPTY_COLLECTION_NAME,
  ensureTestCollection,
  ensureTestData,
} from '../helper-collection';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';

export async function globalSetup(): Promise<void> {
  await setupTestEnvironment();
  await ensureTestData();
  await ensureMapGridPreset(COLLECTION_NAME);
  await ensureTestCollection(EMPTY_COLLECTION_NAME);
  await ensureMapGridPreset(EMPTY_COLLECTION_NAME);
}

export default globalSetup;
