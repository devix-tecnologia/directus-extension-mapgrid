/**
 * Where the anonymous public's permissions live, in either Directus.
 *
 * Directus 10 hangs them on `role: null`; Directus 11 moved permissions onto
 * policies, and the public is the policy named `$t:public_label` — a filter on
 * `role` there is refused outright. Asked once per run.
 */
import { apiRequest, type DirectusCollectionResponse, unwrapItems } from './directus-api';

export interface PublicScope {
  /** The query-string filter that selects the public's permissions. */
  filter: string;
  /** What a new public permission carries to belong to the public. */
  owner: { role: null } | { policy: string };
}

let scope: Promise<PublicScope> | null = null;

const resolve = async (): Promise<PublicScope> => {
  try {
    const [policy] = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: string }>>(
        'GET',
        `/policies?filter[name][_eq]=${encodeURIComponent('$t:public_label')}&fields=id&limit=1`
      )
    );
    if (policy) return { filter: `filter[policy][_eq]=${policy.id}`, owner: { policy: policy.id } };
  } catch {
    // Directus 10 has no policies: the public is still `role: null`
  }
  return { filter: 'filter[role][_null]=true', owner: { role: null } };
};

export const publicScope = (): Promise<PublicScope> => {
  scope ??= resolve();
  return scope;
};
