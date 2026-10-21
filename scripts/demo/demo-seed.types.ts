import type { DemoVisitor } from './demo-access.types';

/** Who seeds the demo, and who it is seeded for. */
export interface DemoSeedOptions {
  adminEmail: string;
  adminPassword: string;
  visitor: DemoVisitor;
}

/**
 * Seeds a running Directus into the read-only MapGrid demo: the LPR readings,
 * the MapGrid as their layout, the visitor and the project's login note.
 *
 * Safe to run again: each run puts back what visitors changed.
 */
export interface IDemoSeed {
  /** Waits for Directus, then seeds it. */
  run(): Promise<void>;
  /** Throws unless the visitor can read and cannot write, and anonymous access is closed. */
  checkReadOnly(): Promise<void>;
}
