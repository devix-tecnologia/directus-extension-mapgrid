import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  type ITaskQueue,
  OPEN_STATUSES,
  type QueuedTask,
  type ReservedTasks,
  type ScannedQueue,
  TaskStatus,
} from './task-queue.types.ts';

/**
 * The queue order: **the lowest `Priority` wins**.
 *
 * This is where this queue diverges from geohub's, and the divergence is the
 * reason the file was not copied from there. In taskin, `Priority` is stored in
 * the task's `order` field — it is a POSITION in the queue, not a weight.
 * Sorting descending would invert the order the repository wrote.
 *
 * And here that is not theory: commit `f83f2a6` reprioritised the three open
 * tasks precisely so the order would reflect the dependencies — "010 goes to
 * 10, 007 to 40 and 006 to 700", because 007 and 006 say in their own text that
 * they depend on 010. Read from highest to lowest, the queue would hand over
 * 006 first, which is exactly the one that cannot come first.
 *
 * And there is **no priority cutoff** in this queue, for the same reason: a
 * lower bound here would hide precisely the top. Whatever is not the agent's is
 * in `reserved.ts`, with the reason written down.
 *
 * The rendered text stays in Portuguese because it is read inside
 * `prompt.md`, which is written in Portuguese like the rest of `TASKS/`.
 */
export const ORDER = 'ascending' as const;

/** `Priority: 250`, with or without a leading `- `, in English or Portuguese. */
const PRIORITY_PATTERN = /^[-*\s]*(?:Priority|Prioridade):\s*(\d+)\s*$/m;
const DIFFICULTY_PATTERN = /^[-*\s]*(?:Difficulty|Dificuldade):\s*(\d+)\s*$/m;
const STATUS_PATTERN = /^[-*\s]*(?:Status):\s*(\S+)\s*$/m;

/**
 * The title formats that coexist in `TASKS/`:
 *
 *   `# Task 006 — Navegar e reproduzir os registros no mapa`   (em dash)
 *   `# Task 001 - Setup Project`                               (hyphen)
 *   `# 🧩 Task 010 — ...`                                      (with emoji)
 *
 * A pattern matching only one of them would lose part of the queue in silence.
 */
const TITLE_PATTERN = /^#\s*(?:\S+\s+)?Task\s+(\d+)\s*[-–—]\s*(.+?)\s*$/m;

function readNumber(text: string, pattern: RegExp): number | undefined {
  const matched = pattern.exec(text);
  if (matched?.[1] === undefined) return undefined;
  const value = Number.parseInt(matched[1], 10);
  return Number.isNaN(value) ? undefined : value;
}

export class TaskQueue implements ITaskQueue {
  readonly #directory: string;
  readonly #reserved: ReservedTasks;

  constructor(directory: string, reserved: ReservedTasks = {}) {
    this.#directory = directory;
    this.#reserved = reserved;
  }

  #readTasks(): QueuedTask[] {
    const names = readdirSync(this.#directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^task-\d+.*\.md$/.test(entry.name))
      .map((entry) => entry.name)
      .sort();

    return names.map((name) => {
      const path = join(this.#directory, name);
      const text = readFileSync(path, 'utf8');
      const titleMatch = TITLE_PATTERN.exec(text);
      const statusMatch = STATUS_PATTERN.exec(text);

      return {
        id: titleMatch?.[1] ?? /^task-(\d+)/.exec(name)?.[1] ?? '???',
        title: titleMatch?.[2] ?? name,
        status: (statusMatch?.[1] as TaskStatus | undefined) ?? 'unknown',
        priority: readNumber(text, PRIORITY_PATTERN),
        difficulty: readNumber(text, DIFFICULTY_PATTERN),
        file: path,
      };
    });
  }

  scan(): ScannedQueue {
    const all = this.#readTasks();
    const known = new Set<string>(Object.values(TaskStatus));
    const unknownStatus = all.filter((task) => !known.has(task.status));
    const open = all.filter((task) => OPEN_STATUSES.includes(task.status as TaskStatus));

    const withoutPriority = open.filter((task) => task.priority === undefined);
    const sorted = open
      .filter((task): task is QueuedTask & { priority: number } => task.priority !== undefined)
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

    return {
      eligible: sorted.filter((task) => this.#reserved[task.id] === undefined),
      reserved: sorted.filter((task) => this.#reserved[task.id] !== undefined),
      withoutPriority,
      unknownStatus,
    };
  }

  render(queue: ScannedQueue): string {
    const lines: string[] = [];

    if (queue.eligible.length === 0) {
      lines.push(
        'NENHUMA tarefa aberta é sua nesta rodada. **Pare e relate** — não pegue ' +
          'tarefa reservada nem tarefa sem prioridade.'
      );
    } else {
      lines.push('Tarefas abertas, **da menor `Priority` para a maior** — a primeira é a sua:');
      lines.push('');
      lines.push('| Priority | ID  | Status      | Dif. | Título |');
      lines.push('| -------- | --- | ----------- | ---- | ------ |');
      for (const task of queue.eligible) {
        const difficulty =
          task.difficulty === undefined ? '  — ' : String(task.difficulty).padStart(4);
        lines.push(
          `| ${String(task.priority).padStart(8)} | ${task.id} | ${task.status.padEnd(11)} | ${difficulty} | ${task.title} |`
        );
      }
    }

    lines.push('');
    lines.push(
      `Fora da fila: ${queue.withoutPriority.length} aberta(s) **sem linha \`Priority:\`**. ` +
        'Elas não são despriorizadas — são não classificadas, e nenhuma delas é sua ' +
        'nesta rodada.'
    );

    if (queue.reserved.length > 0) {
      lines.push('');
      lines.push(
        'Reservadas para outra pessoa nesta rodada (**não pegue nenhuma delas**, ' +
          'mesmo estando à frente da primeira da fila):'
      );
      for (const task of queue.reserved) {
        lines.push(
          `- **task-${task.id}** (Priority ${task.priority}) — ${this.#reserved[task.id]}`
        );
      }
    }

    if (queue.unknownStatus.length > 0) {
      const sample = [...new Set(queue.unknownStatus.map((task) => task.status))].join(', ');
      lines.push('');
      lines.push(
        `⚠️ ${queue.unknownStatus.length} tarefa(s) com **status que este código não ` +
          `conhece** (${sample}) ficaram fora da fila. Não é decisão de prioridade — é ` +
          'limitação desta ferramenta, e vale relatar.'
      );
    }

    return lines.join('\n');
  }
}
