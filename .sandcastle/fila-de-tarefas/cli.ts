#!/usr/bin/env node
/**
 * Ponto de entrada que o `prompt.md` invoca.
 *
 * Chamado por caminho direto, e não por `pnpm`, de propósito: um comando que só
 * LÊ a fila não pode ter efeito colateral, e `pnpm <script>` neste projeto passa
 * pela verificação de dependências antes de rodar qualquer coisa.
 *
 * `--experimental-strip-types` é explícito, e não deixado ao padrão do Node: o
 * `.tool-versions` fixa a 22.13.1, onde o apagamento de tipos existe mas ainda
 * está atrás da flag. Sem ela o comando morre com `Unknown file extension
 * ".ts"` — e morre no meio do prompt, onde o agente não tem como consertar.
 */
import { join } from 'node:path';

import { FilaDeTarefas } from './fila-de-tarefas.ts';
import { TAREFAS_RESERVADAS } from './reservadas.ts';

const raiz = process.argv[2] ?? join(import.meta.dirname, '..', '..', 'TASKS');
const fila = new FilaDeTarefas(raiz, TAREFAS_RESERVADAS);
process.stdout.write(`${fila.renderizar(fila.apurar())}\n`);
