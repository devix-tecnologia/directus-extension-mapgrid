import { deleteTestCollection } from '../helper-collection.js';
import { EMPTY_COLLECTION_NAME } from './global-setup.js';

export async function globalTeardown(): Promise<void> {
  await deleteTestCollection(EMPTY_COLLECTION_NAME);
  await deleteTestCollection();
}

export default globalTeardown;
