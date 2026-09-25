import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { TaskQueue } from './task-queue.ts';

const REPO_ROOT = join(import.meta.dirname, '..', '..');

const disposable: string[] = [];
afterAll(() => disposable.forEach((d) => rmSync(d, { recursive: true, force: true })));

function withTasks(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'queue-'));
  disposable.push(dir);
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

/** The format this repository's tasks use: no `- `, with an em dash. */
const task = (id: string, title: string, status: string, priority?: number) =>
  [
    `# Task ${id} — ${title}`,
    '',
    `Status: ${status}`,
    'Type: feat',
    'Assignee: A definir',
    ...(priority === undefined ? [] : [`Priority: ${priority}`]),
    '',
  ].join('\n');

describe('TaskQueue', () => {
  it('sorts from the LOWEST priority up — in taskin, Priority is the order', () => {
    // The regression this test guards is geohub's queue copied without
    // thinking: there it sorts descending, and here that would hand over 006
    // (700) before 010 (10) — exactly the inversion of the dependency that
    // commit f83f2a6 wrote.
    const dir = withTasks({
      'task-006-later.md': task('006', 'depends on 010', 'pending', 700),
      'task-010-first.md': task('010', 'unblocks the others', 'pending', 10),
    });
    expect(new TaskQueue(dir).scan().eligible.map((t) => t.id)).toEqual(['010', '006']);
  });

  it('reads both metadata formats taskin writes', () => {
    // `Status: pending` is what is in TASKS/ today; `- Status: pending` is
    // taskin's other style. A pattern matching only one would lose the whole
    // task — and lose it in silence, turning it into "unknown".
    const dir = withTasks({
      'task-001-no-dash.md': '# Task 001 — No dash\n\nStatus: pending\nPriority: 20\n',
      'task-002-with-dash.md': '# Task 002 - With dash\n\n- Status: pending\n- Priority: 30\n',
    });
    const queue = new TaskQueue(dir).scan();
    expect(queue.eligible.map((t) => t.title)).toEqual(['No dash', 'With dash']);
  });

  it('reads the difficulty when it exists, and does not invent one when it does not', () => {
    const dir = withTasks({
      'task-007-with.md': `${task('007', 'with difficulty', 'pending', 40)}Difficulty: 2\n`,
      'task-008-without.md': task('008', 'without difficulty', 'pending', 50),
    });
    const queue = new TaskQueue(dir).scan();
    expect(queue.eligible.map((t) => t.difficulty)).toEqual([2, undefined]);
  });

  it('"no priority" does not become priority zero — which here would be first place', () => {
    const dir = withTasks({
      'task-001-none.md': task('001', 'unclassified', 'pending'),
      'task-002-ok.md': task('002', 'eligible', 'pending', 500),
    });
    const queue = new TaskQueue(dir).scan();
    expect(queue.withoutPriority.map((t) => t.id)).toEqual(['001']);
    expect(queue.eligible.map((t) => t.id)).toEqual(['002']);
  });

  it('excludes a closed task even with the highest priority in the queue', () => {
    const dir = withTasks({ 'task-001-done.md': task('001', 'already done', 'done', 1) });
    expect(new TaskQueue(dir).scan().eligible).toHaveLength(0);
  });

  it('`in-review` is NOT in the queue: it is done and waiting for a human review', () => {
    const dir = withTasks({ 'task-001-r.md': task('001', 'in review', 'in-review', 10) });
    expect(new TaskQueue(dir).scan().eligible).toHaveLength(0);
  });

  it('a status the code does not know is REPORTED, never dropped in silence', () => {
    const dir = withTasks({
      'task-001-x.md': task('001', 'new status', 'waiting-on-client', 500),
    });
    const service = new TaskQueue(dir);
    const queue = service.scan();
    expect(queue.unknownStatus.map((t) => t.status)).toEqual(['waiting-on-client']);
    expect(service.render(queue)).toMatch(/status que este código não conhece/);
  });

  it('a RESERVED task leaves the eligible queue, and shows up in the report with the reason', () => {
    const dir = withTasks({
      'task-010-mine.md': task('010', 'big refactor', 'pending', 10),
      'task-007-theirs.md': task('007', 'directus map', 'pending', 40),
    });
    const queue = new TaskQueue(dir, { '010': 'em andamento e minha' });
    const scanned = queue.scan();
    expect(scanned.eligible.map((t) => t.id)).toEqual(['007']);
    expect(scanned.reserved.map((t) => t.id)).toEqual(['010']);
    expect(queue.render(scanned)).toMatch(/em andamento e minha/);
  });

  it('tells the agent to STOP when the eligible queue is empty, instead of suggesting leftovers', () => {
    // The failure this test guards: an empty queue rendered as a blank table
    // makes the agent conclude it should take anything.
    const dir = withTasks({ 'task-010-mine.md': task('010', 'reserved', 'pending', 10) });
    const service = new TaskQueue(dir, { '010': 'minha' });
    const text = service.render(service.scan());
    expect(text).toMatch(/NENHUMA tarefa aberta é sua/);
    expect(text).toMatch(/Pare e relate/);
  });

  it('reserving a non-existent id neither breaks nor invents a task', () => {
    const dir = withTasks({ 'task-007-ok.md': task('007', 'exists', 'pending', 40) });
    const scanned = new TaskQueue(dir, { '999': 'não existe' }).scan();
    expect(scanned.eligible.map((t) => t.id)).toEqual(['007']);
    expect(scanned.reserved).toEqual([]);
  });

  it('the order written in prompt.md is the same one the code applies', () => {
    // A narrow and deliberate duplication: the prompt is the text the agent
    // reads, the code is the filter that acts. This test is what keeps the two
    // from diverging — and the plausible divergence here is not subtle, it is
    // the inversion of the queue.
    const prompt = readFileSync(join(REPO_ROOT, '.sandcastle', 'prompt.md'), 'utf8');
    expect(prompt).toMatch(/menor\b.*\bvence/i);
    expect(prompt).not.toMatch(/maior\b[^.\n]*\bvence/i);
  });
});
