import { COLLECTION_NAME, deleteTestCollection, EMPTY_COLLECTION_NAME } from '../helper-collection';

export async function globalTeardown(): Promise<void> {
  await deleteTestCollection(EMPTY_COLLECTION_NAME);
  await deleteTestCollection(COLLECTION_NAME);
}

export default globalTeardown;
