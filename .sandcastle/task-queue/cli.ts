#!/usr/bin/env node
/**
 * The entry point `prompt.md` invokes.
 *
 * Called by direct path, and not through `pnpm`, on purpose: a command that
 * only READS the queue must not have a side effect, and `pnpm <script>` in this
 * project goes through the dependency check before running anything.
 *
 * `--experimental-strip-types` is explicit, and not left to the Node default:
 * `.tool-versions` pins 22.13.1, where type stripping exists but is still
 * behind the flag. Without it the command dies with `Unknown file extension
 * ".ts"` — and it dies in the middle of the prompt, where the agent cannot fix
 * it.
 */
import { join } from 'node:path';

import { TaskQueue } from './task-queue.ts';
import { RESERVED_TASKS } from './reserved.ts';

const root = process.argv[2] ?? join(import.meta.dirname, '..', '..', 'TASKS');
const queue = new TaskQueue(root, RESERVED_TASKS);
process.stdout.write(`${queue.render(queue.scan())}\n`);
