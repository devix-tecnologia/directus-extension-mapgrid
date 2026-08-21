import { apiRequest } from './setup.js';
import { COLLECTION_NAME } from './helper-collection.js';

function getToken(): string {
  return String(process.env.DIRECTUS_ACCESS_TOKEN);
}

export async function getTestItems() {
  const response = await apiRequest('GET', `/items/${COLLECTION_NAME}?sort=name`, undefined, getToken());

  const items = (response.data as Record<string, unknown>)?.data || response.data || response;
  return Array.isArray(items) ? items : [];
}

export async function deleteTestItems() {
  try {
    const items = await getTestItems();
    for (const item of items as Array<{ id: string | number }>) {
      try {
        await apiRequest('DELETE', `/items/${COLLECTION_NAME}/${item.id}`, undefined, getToken());
      } catch {
        // ignore
      }
    }
  } catch {
    // collection might not exist
  }
}
