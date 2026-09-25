import type { EvidenceName } from './evidence-name.types';

/** Where the evidence lives, relative to the repository root. */
export const EVIDENCE_DIRECTORY = 'TASKS/assets';

/**
 * The evidence file name.
 *
 * It starts with the task number because that is how `TASKS/assets/` is read:
 * whoever opens the folder looks for the task, not for the subject. The moment
 * (`antes`/`depois`) goes in the NAME, and not in subdirectories, so the pair
 * shows up side by side.
 */
export function evidenceName({ task, label, moment }: EvidenceName): string {
  if (!/^[a-z0-9-]+$/i.test(label)) {
    throw new Error(
      `invalid label: ${JSON.stringify(label)} — use only letters, digits and hyphens. ` +
        `A label with a slash or ".." would write the PNG outside ${EVIDENCE_DIRECTORY}.`
    );
  }

  const number = String(task)
    .replace(/^task-/i, '')
    .padStart(3, '0');

  return `task-${number}-${label}${moment ? `-${moment}` : ''}.png`;
}
