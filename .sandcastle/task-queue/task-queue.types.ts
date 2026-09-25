/**
 * Types of the task queue the Sandcastle presents to the agent.
 *
 * Why this module exists: `taskin list` **does not print the priority**. It
 * sorts by id and shows status, type, assignee and title. The agent decides by
 * `Priority`, so a list without the column the rule uses is choosing in the
 * dark.
 *
 * The priority lives in a `Priority: N` line of the task's own markdown, and
 * that is where it is read from.
 */

/** The statuses taskin uses in a task header. */
export const TaskStatus = {
  pending: 'pending',
  todo: 'todo',
  inProgress: 'in-progress',
  paused: 'paused',
  blocked: 'blocked',
  inReview: 'in-review',
  done: 'done',
  canceled: 'canceled',
} as const satisfies Record<string, string>;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

/**
 * The statuses that count as "open".
 *
 * `in-review` is left out on purpose: the task is already done and waiting for
 * a human review. Putting it back in the queue would make the agent redo
 * finished work.
 */
export const OPEN_STATUSES: readonly TaskStatus[] = [
  TaskStatus.pending,
  TaskStatus.todo,
  TaskStatus.inProgress,
  TaskStatus.paused,
  TaskStatus.blocked,
];

/**
 * A task read from the markdown.
 *
 * `priority` is `undefined` when the file does not declare `Priority:`. That is
 * **not** the same as priority zero — and, in this queue, zero would be first
 * place. The type refuses the confusion.
 */
export interface QueuedTask {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus | 'unknown';
  readonly priority: number | undefined;
  readonly difficulty: number | undefined;
  readonly file: string;
}

/**
 * Tasks that exist, are open, but are **not the agent's** — somebody took them,
 * or they depend on a decision that is not the agent's.
 *
 * The key is the task id (`'010'`); the value is the reason, spelled out. The
 * reason is mandatory on purpose: a reservation with no justification is
 * indistinguishable from forgetfulness, and turns into a zombie list like any
 * allowlist.
 */
export type ReservedTasks = Readonly<Record<string, string>>;

/**
 * What the scan produces.
 *
 * `withoutPriority` is not dropped in silence: it is counted and reported. A
 * queue that hides what it left out makes the agent conclude there is no work
 * when there is.
 */
export interface ScannedQueue {
  readonly eligible: readonly QueuedTask[];
  readonly withoutPriority: readonly QueuedTask[];
  readonly reserved: readonly QueuedTask[];
  /**
   * Tasks whose status this code does not know.
   *
   * They do NOT enter the queue — deciding on an unknown status would be
   * guessing — but they are reported out loud.
   */
  readonly unknownStatus: readonly QueuedTask[];
}

export interface ITaskQueue {
  /** Reads the task directory and returns the scanned queue. */
  scan(): ScannedQueue;
  /** Renders the scanned queue for the agent's prompt. */
  render(queue: ScannedQueue): string;
}
