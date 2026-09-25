import type { ReservedTasks } from './task-queue.types.ts';

/**
 * Open tasks that are **not the Sandcastle agent's**.
 *
 * This list exists because priority and recipient are different questions.
 * Touching a task's `Priority` just to hide it from the agent would lie in the
 * field taskin uses as the queue ORDER — and the order here carries dependency
 * between tasks, not preference.
 *
 * ## The criterion
 *
 * What goes into this list is a task whose **verification instrument the agent
 * does not have**, or one that depends on a decision that is not the agent's.
 * It is not a list of hard tasks nor of important tasks: it is the list of the
 * ones it would have no way to prove, or no way to decide.
 *
 * ## Maintenance
 *
 * An entry that has been fulfilled **leaves here**. A forgotten reservation is
 * worse than no reservation: it disappears from the agent's queue forever, in
 * silence, and nobody notices because the effect is an absence. The queue report
 * prints this whole list on every round precisely so a zombie entry stays
 * visible.
 *
 * ## Why it is empty as of 2026-09-23
 *
 * The three open tasks (010, 007, 006) are verifiable in here: the sandbox gets
 * the host's Docker socket, so `pnpm test:e2e` — which is where 010 proves
 * itself — really runs. If the socket ever goes away, all three come back here.
 */
export const RESERVED_TASKS = {} as const satisfies ReservedTasks;
