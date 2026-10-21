import {
  apiRequest,
  type DirectusCollectionResponse,
  unwrapItems,
} from '../../tests/helpers/directus-api';
import type { DemoPermission, DemoVisitor, IDemoAccess } from './demo-access.types';

export const DEMO_ROLE_NAME = 'Visitante (somente leitura)';

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
    for (const collection of [...collections, 'directus_files']) {
      const rows = unwrapItems(
        await apiRequest<DirectusCollectionResponse<{ id: number }>>(
          'GET',
          `/permissions?filter[collection][_eq]=${collection}&filter[role][_null]=true&fields=id,action&limit=-1`
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
    const [existing] = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: string }>>(
        'GET',
        `/roles?filter[name][_eq]=${encodeURIComponent(DEMO_ROLE_NAME)}&fields=id`
      )
    );
    const role =
      existing?.id ??
      (
        await apiRequest<{ data: { id: string } }>('POST', '/roles', {
          name: DEMO_ROLE_NAME,
          icon: 'visibility',
          app_access: true,
          admin_access: false,
          description: 'Sees the collections on show; changes nothing.',
        })
      ).data.id;

    // replaced every run, so a permission granted by hand in the meantime does not survive
    const granted = unwrapItems(
      await apiRequest<DirectusCollectionResponse<{ id: number }>>(
        'GET',
        `/permissions?filter[role][_eq]=${role}&fields=id,action&limit=-1`
      )
    );
    for (const row of granted.filter((row) => row.id != null)) {
      await apiRequest('DELETE', `/permissions/${row.id}`);
    }
    await apiRequest(
      'POST',
      '/permissions',
      this.permissionsFor(collections).map((permission) => ({ ...permission, role }))
    );
    return role;
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

  async presentProject(visitor: DemoVisitor): Promise<void> {
    await apiRequest('PATCH', '/settings', {
      project_name: 'MapGrid',
      project_descriptor: null,
      default_language: 'pt-BR',
      public_note: `Ambiente somente leitura para conhecer o MapGrid. As credenciais são públicas, de propósito: entre com **${visitor.email}** e a senha **${visitor.password}**.`,
    });
  }
}
