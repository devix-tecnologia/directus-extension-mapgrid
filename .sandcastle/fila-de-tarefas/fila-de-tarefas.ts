import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  STATUS_ABERTOS,
  StatusDeTarefa,
  type FilaApurada,
  type IFilaDeTarefas,
  type TarefaNaFila,
  type TarefasReservadas,
} from './fila-de-tarefas.types.ts';

/**
 * A ordem da fila: **menor `Priority` vence**.
 *
 * Este é o ponto onde esta fila diverge da do geohub, e a divergência é a razão
 * de o arquivo não ter sido copiado de lá. No taskin, `Priority` é gravada no
 * campo `order` da tarefa — é POSIÇÃO na fila, não peso. Ordenar decrescente
 * inverteria a ordem que o repositório escreveu.
 *
 * Aqui isso não é teoria: o commit `f83f2a6` repriorizou as três tarefas
 * abertas justamente para a ordem refletir as dependências — "010 vai a 10, 007
 * a 40 e 006 a 700", porque a 007 e a 006 dizem no texto que dependem da 010.
 * Lida do maior para o menor, a fila entregaria a 006 primeiro, que é
 * exatamente a que não pode vir antes.
 *
 * E **não há corte de prioridade** nesta fila, pela mesma razão: um corte
 * inferior aqui esconderia justamente o topo. Quem não é do agente está em
 * `reservadas.ts`, com o motivo escrito.
 */
export const ORDEM = 'crescente' as const;

/** `Priority: 250`, com ou sem `- ` na frente, em inglês ou português. */
const PADRAO_PRIORIDADE = /^[-*\s]*(?:Priority|Prioridade):\s*(\d+)\s*$/m;
const PADRAO_DIFICULDADE = /^[-*\s]*(?:Difficulty|Dificuldade):\s*(\d+)\s*$/m;
const PADRAO_STATUS = /^[-*\s]*(?:Status):\s*(\S+)\s*$/m;

/**
 * Os formatos de título que convivem em `TASKS/`:
 *
 *   `# Task 006 — Navegar e reproduzir os registros no mapa`   (travessão)
 *   `# Task 001 - Setup Project`                               (hífen)
 *   `# 🧩 Task 010 — ...`                                      (com emoji)
 *
 * Um padrão que só casasse um deles perderia parte da fila em silêncio.
 */
const PADRAO_TITULO = /^#\s*(?:\S+\s+)?Task\s+(\d+)\s*[-–—]\s*(.+?)\s*$/m;

function lerNumero(texto: string, padrao: RegExp): number | undefined {
  const casou = padrao.exec(texto);
  if (casou?.[1] === undefined) return undefined;
  const valor = Number.parseInt(casou[1], 10);
  return Number.isNaN(valor) ? undefined : valor;
}

export class FilaDeTarefas implements IFilaDeTarefas {
  readonly #diretorio: string;
  readonly #reservadas: TarefasReservadas;

  constructor(diretorio: string, reservadas: TarefasReservadas = {}) {
    this.#diretorio = diretorio;
    this.#reservadas = reservadas;
  }

  #lerTarefas(): TarefaNaFila[] {
    const nomes = readdirSync(this.#diretorio, { withFileTypes: true })
      .filter((e) => e.isFile() && /^task-\d+.*\.md$/.test(e.name))
      .map((e) => e.name)
      .sort();

    return nomes.map((nome) => {
      const caminho = join(this.#diretorio, nome);
      const texto = readFileSync(caminho, 'utf8');
      const tituloCasou = PADRAO_TITULO.exec(texto);
      const statusCasou = PADRAO_STATUS.exec(texto);

      return {
        id: tituloCasou?.[1] ?? /^task-(\d+)/.exec(nome)?.[1] ?? '???',
        titulo: tituloCasou?.[2] ?? nome,
        status: (statusCasou?.[1] as StatusDeTarefa | undefined) ?? 'desconhecido',
        prioridade: lerNumero(texto, PADRAO_PRIORIDADE),
        dificuldade: lerNumero(texto, PADRAO_DIFICULDADE),
        arquivo: caminho,
      };
    });
  }

  apurar(): FilaApurada {
    const todas = this.#lerTarefas();
    const conhecidos = new Set<string>(Object.values(StatusDeTarefa));
    const statusDesconhecido = todas.filter((t) => !conhecidos.has(t.status));
    const abertas = todas.filter((t) => STATUS_ABERTOS.includes(t.status as StatusDeTarefa));

    const semPrioridade = abertas.filter((t) => t.prioridade === undefined);
    const ordenadas = abertas
      .filter((t): t is TarefaNaFila & { prioridade: number } => t.prioridade !== undefined)
      .sort((a, b) => a.prioridade - b.prioridade || a.id.localeCompare(b.id));

    return {
      elegiveis: ordenadas.filter((t) => this.#reservadas[t.id] === undefined),
      reservadas: ordenadas.filter((t) => this.#reservadas[t.id] !== undefined),
      semPrioridade,
      statusDesconhecido,
    };
  }

  renderizar(fila: FilaApurada): string {
    const linhas: string[] = [];

    if (fila.elegiveis.length === 0) {
      linhas.push(
        'NENHUMA tarefa aberta é sua nesta rodada. **Pare e relate** — não pegue ' +
          'tarefa reservada nem tarefa sem prioridade.'
      );
    } else {
      linhas.push('Tarefas abertas, **da menor `Priority` para a maior** — a primeira é a sua:');
      linhas.push('');
      linhas.push('| Priority | ID  | Status      | Dif. | Título |');
      linhas.push('| -------- | --- | ----------- | ---- | ------ |');
      for (const t of fila.elegiveis) {
        const dificuldade = t.dificuldade === undefined ? '  — ' : String(t.dificuldade).padStart(4);
        linhas.push(
          `| ${String(t.prioridade).padStart(8)} | ${t.id} | ${t.status.padEnd(11)} | ${dificuldade} | ${t.titulo} |`
        );
      }
    }

    linhas.push('');
    linhas.push(
      `Fora da fila: ${fila.semPrioridade.length} aberta(s) **sem linha \`Priority:\`**. ` +
        'Elas não são despriorizadas — são não classificadas, e nenhuma delas é sua ' +
        'nesta rodada.'
    );

    if (fila.reservadas.length > 0) {
      linhas.push('');
      linhas.push(
        'Reservadas para outra pessoa nesta rodada (**não pegue nenhuma delas**, ' +
          'mesmo estando à frente da primeira da fila):'
      );
      for (const t of fila.reservadas) {
        linhas.push(`- **task-${t.id}** (Priority ${t.prioridade}) — ${this.#reservadas[t.id]}`);
      }
    }

    if (fila.statusDesconhecido.length > 0) {
      const amostra = [...new Set(fila.statusDesconhecido.map((t) => t.status))].join(', ');
      linhas.push('');
      linhas.push(
        `⚠️ ${fila.statusDesconhecido.length} tarefa(s) com **status que este código não ` +
          `conhece** (${amostra}) ficaram fora da fila. Não é decisão de prioridade — é ` +
          'limitação desta ferramenta, e vale relatar.'
      );
    }

    return linhas.join('\n');
  }
}
