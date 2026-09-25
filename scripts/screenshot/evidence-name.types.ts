/**
 * File names for a task's visual evidence.
 *
 * Brought over from `geohub/scripts/captura-de-tela`, which is where the team
 * settled the convention. Only the naming came across: the rest of that module
 * serves a static surface — a directory materialised from a revision and served
 * on a port — and ours is the Directus app, which requires a login and the
 * built extension. What captures here is the Playwright script itself, which
 * already knows how to log in.
 *
 * The rule behind the convention (Sidarta, 2026-09-14): a task that implemented
 * a screen must have the screen attached as evidence, and when the change is an
 * improvement or a fix to a screen that already existed, the evidence brings
 * **before and after**.
 */

/**
 * The moment a piece of evidence captures.
 *
 * The values stay in Portuguese because they are also the file name suffix and
 * the `EVIDENCE_MOMENT` value the round's instructions document; the images
 * already in `TASKS/assets/` carry them.
 */
export type EvidenceMoment = 'antes' | 'depois';

/** A piece of evidence: from which task, of what, and at which moment. */
export interface EvidenceName {
  /** The task number, with or without the `task-` prefix. */
  readonly task: string;
  /** What the image shows, in letters, digits and hyphens. */
  readonly label: string;
  readonly moment?: EvidenceMoment;
}
