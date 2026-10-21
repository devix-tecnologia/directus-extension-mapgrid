import {
  apiRequest,
  type DirectusCollectionResponse,
  unwrapItems,
} from '../../tests/helpers/directus-api';
import { publicScope } from '../../tests/helpers/public-access';
import type { DemoPermission, DemoVisitor, IDemoAccess } from './demo-access.types';

export const DEMO_ROLE_NAME = 'Visitante (somente leitura)';

const DESCRIPTION = 'Sees the collections on show; changes nothing.';

type PermissionOwner = { role: string } | { policy: string };

const ownerFilter = (owner: PermissionOwner): string =>
  'policy' in owner ? `filter[policy][_eq]=${owner.policy}` : `filter[role][_eq]=${owner.role}`;

const findId = async (path: string, name: string): Promise<string | undefined> => {
  const [existing] = unwrapItems(
    await apiRequest<DirectusCollectionResponse<{ id: string }>>(
      'GET',
      `${path}?filter[name][_eq]=${encodeURIComponent(name)}&fields=id`
    )
  );
  return existing?.id;
};

export class DemoAccess implements IDemoAccess {
  permissionsFor(collections: readonly string[]): DemoPermission[] {
    return [...collections, 'directus_files'].map((collection) => ({
      collection,
      action: 'read',
      fields: ['*'],
      permissions: {},
    }));
  }

  async closePublicAccess(collections: readonly string[]): Promise<void> {
    const scope = await publicScope();
    for (const collection of [...collections, 'directus_files']) {
      const rows = unwrapItems(
        await apiRequest<DirectusCollectionResponse<{ id: number }>>(
          'GET',
          `/permissions?filter[collection][_eq]=${collection}&${scope.filter}&fields=id,action&limit=-1`
        )
      );
      // `fields=id` alone comes back as `{}` on 10.13, hence `action` too; and the list
      // may bring Directus' built-in permissions, which have no id and are not ours
      for (const row of rows.filter((row) => row.id != null)) {
        await apiRequest('DELETE', `/permissions/${row.id}`);
      }
    }
  }

  async ensureRole(collections: readonly string[]): Promise<string> {
    const policies = 'policy' in (await publicScope()).owner;
    const role =
      (await findId('/roles', DEMO_ROLE_NAME)) ??
      (
        await apiRequest<{ data: { id: string } }>('POST', '/roles', {
          name: DEMO_ROLE_NAME,
          icon: 'visibility',
          description: DESCRIPTION,
          // Directus 11 moved app and admin access onto policies
          ...(policies ? {} : { app_access: true, admin_access: false }),
        })
      ).data.id;
    const owner: PermissionOwner = policies ? { policy: await this.ensurePolicy(role) } : { role };

    // replaced every run, so a permission granted by hand in the meantime does not survive
    const granted = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: number }>>(
        'GET',
        `/permissions?${ownerFilter(owner)}&fields=id,action&limit=-1`
      )
    );
    for (const row of granted.filter((row) => row.id != null)) {
      await apiRequest('DELETE', `/permissions/${row.id}`);
    }
    await apiRequest(
      'POST',
      '/permissions',
      this.permissionsFor(collections).map((permission) => ({ ...permission, ...owner }))
    );
    return role;
  }

  /** On Directus 11: the read-only policy, attached to the role; returns the policy's id. */
  private async ensurePolicy(role: string): Promise<string> {
    const policy =
      (await findId('/policies', DEMO_ROLE_NAME)) ??
      (
        await apiRequest<{ data: { id: string } }>('POST', '/policies', {
          name: DEMO_ROLE_NAME,
          icon: 'visibility',
          description: DESCRIPTION,
          app_access: true,
          admin_access: false,
        })
      ).data.id;
    const [attached] = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: string }>>(
        'GET',
        `/access?filter[role][_eq]=${role}&filter[policy][_eq]=${policy}&fields=id`
      )
    );
    if (!attached) await apiRequest('POST', '/access', { role, policy });
    return policy;
  }

  async ensureVisitor(role: string, visitor: DemoVisitor): Promise<void> {
    const [existing] = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: string }>>(
        'GET',
        `/users?filter[email][_eq]=${encodeURIComponent(visitor.email)}&fields=id`
      )
    );
    const profile = {
      email: visitor.email,
      password: visitor.password,
      role,
      first_name: 'Visitante',
      last_name: 'MapGrid',
      language: 'pt-BR',
      status: 'active',
    };
    if (existing) await apiRequest('PATCH', `/users/${existing.id}`, profile);
    else await apiRequest('POST', '/users', profile);
  }

  async clearVisitorTraces(visitor: DemoVisitor): Promise<void> {
    const [user] = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: string }>>(
        'GET',
        `/users?filter[email][_eq]=${encodeURIComponent(visitor.email)}&fields=id`
      )
    );
    if (!user) return;
    const traces: [path: string, owner: string][] = [['/presets', 'user']];
    // Directus 11 lets whoever reads an item comment on it; 10 keeps comments in the activity
    if ('policy' in (await publicScope()).owner) traces.push(['/comments', 'user_created']);
    for (const [path, owner] of traces) {
      const rows = unwrapItems(
        await apiRequest<DirectusCollectionResponse<{ id: string | number }>>(
          'GET',
          `${path}?filter[${owner}][_eq]=${user.id}&fields=id&limit=-1`
        )
      );
      for (const row of rows) await apiRequest('DELETE', `${path}/${row.id}`);
    }
  }

  async presentProject(visitor: DemoVisitor): Promise<void> {
    await apiRequest('PATCH', '/settings', {
      project_name: 'MapGrid',
      project_descriptor: null,
      default_language: 'pt-BR',
      public_note: `Ambiente somente leitura para conhecer o MapGrid. As credenciais são públicas, de propósito: entre com **${visitor.email}** e a senha **${visitor.password}**.`,
    });
  }
}
