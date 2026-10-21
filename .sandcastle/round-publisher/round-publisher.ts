import type {
  IRoundPublisher,
  PreservedReason,
  PublishOutcome,
  RoundPublisherOptions,
} from './round-publisher.types.ts';

export class RoundPublisher implements IRoundPublisher {
  private readonly options: RoundPublisherOptions;
  private readonly maxAttempts: number;

  constructor(options: RoundPublisherOptions) {
    this.options = options;
    this.maxAttempts = options.maxAttempts ?? 3;
  }

  syncTarget(target: string): void {
    const { git, remote } = this.options;
    git('fetch', '-q', remote);
    git('merge', '-q', '--ff-only', `${remote}/${target}`);
  }

  publish(branch: string, target: string): PublishOutcome {
    const { git, remote, runGates } = this.options;

    if (git('status', '--porcelain', '--untracked-files=no') !== '') {
      return preserved('dirty-tree', 'the tree has uncommitted changes');
    }
    git('checkout', '-q', target);

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        this.syncTarget(target);
      } catch (error) {
        return preserved('target-diverged', describe(error));
      }

      try {
        git('rebase', '-q', target, branch);
      } catch (error) {
        git('rebase', '--abort');
        git('checkout', '-q', target);
        return preserved('rebase-conflict', describe(error));
      }

      const passed = runGates();
      git('checkout', '-q', target);
      if (!passed) return preserved('gates-failed', `the gates failed on ${branch}`);

      const before = git('rev-parse', 'HEAD');
      git('merge', '-q', '--no-ff', '-m', `chore: integra ${branch} no ${target}`, branch);
      try {
        git('push', '-q', remote, target);
        return { status: 'published', mergeCommit: git('rev-parse', 'HEAD') };
      } catch (error) {
        git('reset', '-q', '--keep', before);
        git('fetch', '-q', remote);
        if (git('rev-parse', `${remote}/${target}`) === before) {
          return preserved('push-rejected', describe(error));
        }
        this.options.log?.(`${remote}/${target} moved while the gates ran; attempt ${attempt + 1}`);
      }
    }

    git('merge', '-q', '--ff-only', `${remote}/${target}`);
    return preserved(
      'push-rejected',
      `${remote}/${target} kept moving for ${this.maxAttempts} attempts`
    );
  }
}

function preserved(reason: PreservedReason, detail: string): PublishOutcome {
  return { status: 'preserved', reason, detail };
}

function describe(error: unknown): string {
  if (error && typeof error === 'object' && 'stderr' in error && String(error.stderr).trim()) {
    return String(error.stderr).trim();
  }
  return error instanceof Error ? error.message : String(error);
}
