import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RoundPublisher } from './round-publisher.ts';
import type { Git } from './round-publisher.types.ts';

const IDENTITY = {
  GIT_AUTHOR_NAME: 'Round Test',
  GIT_AUTHOR_EMAIL: 'round@test',
  GIT_COMMITTER_NAME: 'Round Test',
  GIT_COMMITTER_EMAIL: 'round@test',
};

function gitIn(cwd: string): Git {
  return (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, ...IDENTITY },
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}

function commitFile(git: Git, dir: string, file: string, content: string, message: string): string {
  writeFileSync(join(dir, file), content);
  git('add', file);
  git('commit', '-q', '-m', message);
  return git('rev-parse', 'HEAD');
}

const BRANCH = 'sandcastle/round-test';

let root: string;
let host: string;
let other: string;
let hostGit: Git;
let otherGit: Git;
let remoteGit: Git;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'round-publisher-'));
  const remote = join(root, 'remote.git');
  host = join(root, 'host');
  other = join(root, 'other');

  execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', remote]);
  remoteGit = gitIn(remote);
  execFileSync('git', ['clone', '-q', remote, host]);
  hostGit = gitIn(host);
  commitFile(hostGit, host, 'base.txt', 'base\n', 'base');
  hostGit('push', '-q', 'origin', 'develop');
  execFileSync('git', ['clone', '-q', remote, other]);
  otherGit = gitIn(other);

  hostGit('checkout', '-q', '-b', BRANCH);
  commitFile(hostGit, host, 'agent.txt', 'agent\n', 'agent work');
  hostGit('checkout', '-q', 'develop');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function publishedElsewhere(file: string, content = `${file}\n`): string {
  otherGit('pull', '-q', '--ff-only');
  const sha = commitFile(otherGit, other, file, content, `published ${file}`);
  otherGit('push', '-q', 'origin', 'develop');
  return sha;
}

function publisher(runGates: () => boolean = () => true) {
  return new RoundPublisher({ git: hostGit, remote: 'origin', runGates });
}

describe('RoundPublisher.publish', () => {
  it('rebases the branch onto what the remote published meanwhile, merges it and pushes', () => {
    const elsewhere = publishedElsewhere('elsewhere.txt');

    const outcome = publisher().publish(BRANCH, 'develop');

    expect(outcome.status).toBe('published');
    const published = remoteGit('rev-parse', 'develop');
    expect(remoteGit('log', '-1', '--format=%s', published)).toBe(
      `chore: integra ${BRANCH} no develop`
    );
    expect(remoteGit('rev-parse', `${published}^1`)).toBe(elsewhere);
    expect(remoteGit('merge-base', `${published}^2`, elsewhere)).toBe(elsewhere);
  });

  it('runs the gates on the rebased branch, with the published work in the tree', () => {
    publishedElsewhere('elsewhere.txt');
    const seen: string[] = [];

    publisher(() => {
      seen.push(hostGit('rev-parse', '--abbrev-ref', 'HEAD'));
      return existsSync(join(host, 'elsewhere.txt')) && existsSync(join(host, 'agent.txt'));
    }).publish(BRANCH, 'develop');

    expect(seen).toEqual([BRANCH]);
    expect(remoteGit('log', '-1', '--format=%s', 'develop')).toContain(BRANCH);
  });

  it('keeps the branch and publishes nothing when the gates fail', () => {
    const before = remoteGit('rev-parse', 'develop');

    const outcome = publisher(() => false).publish(BRANCH, 'develop');

    expect(outcome).toMatchObject({ status: 'preserved', reason: 'gates-failed' });
    expect(remoteGit('rev-parse', 'develop')).toBe(before);
    expect(hostGit('rev-parse', 'develop')).toBe(before);
    expect(hostGit('rev-parse', '--abbrev-ref', 'HEAD')).toBe('develop');
    expect(hostGit('branch', '--list', BRANCH)).not.toBe('');
  });

  it('keeps the branch untouched and leaves no rebase behind on a conflict', () => {
    publishedElsewhere('agent.txt', 'somebody else\n');
    const branchBefore = hostGit('rev-parse', BRANCH);

    const outcome = publisher().publish(BRANCH, 'develop');

    expect(outcome).toMatchObject({ status: 'preserved', reason: 'rebase-conflict' });
    expect(hostGit('rev-parse', BRANCH)).toBe(branchBefore);
    expect(existsSync(join(host, '.git', 'rebase-merge'))).toBe(false);
    expect(existsSync(join(host, '.git', 'rebase-apply'))).toBe(false);
    expect(hostGit('rev-parse', '--abbrev-ref', 'HEAD')).toBe('develop');
  });

  it('redoes fetch, rebase and gates when the remote moves while the gates run', () => {
    let late = '';
    let runs = 0;

    const outcome = publisher(() => {
      runs += 1;
      if (runs === 1) late = publishedElsewhere('late.txt');
      return true;
    }).publish(BRANCH, 'develop');

    expect(outcome.status).toBe('published');
    expect(runs).toBe(2);
    expect(remoteGit('merge-base', '--is-ancestor', late, 'develop')).toBe('');
  });

  it('gives up after the last attempt when the remote keeps moving', () => {
    let runs = 0;

    const outcome = new RoundPublisher({
      git: hostGit,
      remote: 'origin',
      maxAttempts: 2,
      runGates: () => {
        runs += 1;
        publishedElsewhere(`late-${runs}.txt`);
        return true;
      },
    }).publish(BRANCH, 'develop');

    expect(outcome).toMatchObject({ status: 'preserved', reason: 'push-rejected' });
    expect(runs).toBe(2);
    expect(hostGit('rev-parse', 'develop')).toBe(hostGit('rev-parse', 'origin/develop'));
    expect(hostGit('branch', '--list', BRANCH)).not.toBe('');
  });

  it('touches nothing when the tree has uncommitted changes', () => {
    writeFileSync(join(host, 'base.txt'), 'edited by hand\n');
    const branchBefore = hostGit('rev-parse', BRANCH);

    const outcome = publisher().publish(BRANCH, 'develop');

    expect(outcome).toMatchObject({ status: 'preserved', reason: 'dirty-tree' });
    expect(hostGit('rev-parse', BRANCH)).toBe(branchBefore);
    expect(hostGit('status', '--porcelain')).toContain('base.txt');
  });

  it('refuses a local target that diverged from the remote', () => {
    commitFile(hostGit, host, 'local.txt', 'local\n', 'local only');
    publishedElsewhere('elsewhere.txt');

    const outcome = publisher().publish(BRANCH, 'develop');

    expect(outcome).toMatchObject({ status: 'preserved', reason: 'target-diverged' });
  });
});

describe('RoundPublisher.syncTarget', () => {
  it('fast-forwards the checked-out target to the remote', () => {
    const elsewhere = publishedElsewhere('elsewhere.txt');

    publisher().syncTarget('develop');

    expect(hostGit('rev-parse', 'develop')).toBe(elsewhere);
  });
});
