/** Who the visitors of the demo sign in as. Public by design: it is printed on the login page. */
export interface DemoVisitor {
  email: string;
  password: string;
}

/** A permission the demo role is given. */
export interface DemoPermission {
  collection: string;
  action: 'read';
  fields: string[];
  permissions: Record<string, never>;
}

/**
 * Turns a seeded stack into a read-only demo.
 *
 * Every run puts things back as they should be — the visitor's password
 * included, since the app lets a signed-in user change their own — so running
 * it on a schedule undoes whatever a visitor managed to change.
 */
export interface IDemoAccess {
  /** What the demo role reads: the collections shown, and the files their photos are. */
  permissionsFor(collections: readonly string[]): DemoPermission[];
  /** No anonymous access to the collections: only the demo user, signed in, sees them. */
  closePublicAccess(collections: readonly string[]): Promise<void>;
  /** The read-only role and its permissions; returns the role's id. */
  ensureRole(collections: readonly string[]): Promise<string>;
  /** The visitor, in Portuguese, with the known password restored. */
  ensureVisitor(role: string, visitor: DemoVisitor): Promise<void>;
  /**
   * Removes what the visitor could still leave behind: comments and saved
   * bookmarks, which Directus grants every app user and no permission takes away.
   */
  clearVisitorTraces(visitor: DemoVisitor): Promise<void>;
  /** The project's name and the login note telling visitors how to sign in. */
  presentProject(visitor: DemoVisitor): Promise<void>;
}
