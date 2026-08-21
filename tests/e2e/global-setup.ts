import { COLLECTION_NAME, ensureTestCollection, ensureTestData } from '../helper-collection.js';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset.js';
import { setupTestEnvironment } from '../setup.js';

export const EMPTY_COLLECTION_NAME = 'test_mapgrid_empty';

export async function globalSetup(): Promise<void> {
  await setupTestEnvironment();
  await ensureTestData();
  await ensureMapGridPreset(COLLECTION_NAME);
  await ensureTestCollection(EMPTY_COLLECTION_NAME);
  await ensureMapGridPreset(EMPTY_COLLECTION_NAME);
}

export default globalSetup;
