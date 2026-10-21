/** Runs git in the repository the round integrates into, and throws when git fails. */
export type Git = (...args: readonly string[]) => string;

export interface RoundPublisherOptions {
  git: Git;
  /** The remote `target` is published to. */
  remote: string;
  /** Runs the gates on the checked-out tree and says whether they passed. */
  runGates: () => boolean;
  /** How many times fetch, rebase and gates are redone when the push is rejected because the remote moved. Defaults to 3. */
  maxAttempts?: number;
  /** Where progress goes; silent when absent. */
  log?: (line: string) => void;
}

export type PreservedReason =
  | 'dirty-tree'
  | 'target-diverged'
  | 'rebase-conflict'
  | 'gates-failed'
  | 'push-rejected';

export type PublishOutcome =
  | { status: 'published'; mergeCommit: string }
  | { status: 'preserved'; reason: PreservedReason; detail: string };

export interface IRoundPublisher {
  /** Fast-forwards the checked-out `target` to the remote, so a round starts from what is published. */
  syncTarget(target: string): void;
  /**
   * Rebases `branch` onto the freshest `target`, runs the gates on the result,
   * merges it with `--no-ff` and pushes `target`.
   *
   * On any failure `branch` is kept as it was, `target` is left as the remote
   * has it, and `target` is checked out again.
   */
  publish(branch: string, target: string): PublishOutcome;
}
