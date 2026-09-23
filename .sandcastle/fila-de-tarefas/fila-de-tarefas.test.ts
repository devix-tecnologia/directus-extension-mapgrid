import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { FilaDeTarefas } from './fila-de-tarefas.ts';

const RAIZ_REPO = join(import.meta.dirname, '..', '..');

const descartaveis: string[] = [];
afterAll(() => descartaveis.forEach((d) => rmSync(d, { recursive: true, force: true })));

function comTarefas(arquivos: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'fila-'));
  descartaveis.push(dir);
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    writeFileSync(join(dir, nome), conteudo);
  }
  return dir;
}

/** O formato que as tarefas deste repositório usam: sem `- `, com travessão. */
const tarefa = (id: string, titulo: string, status: string, prioridade?: number) =>
  [
    `# Task ${id} — ${titulo}`,
    '',
    `Status: ${status}`,
    'Type: feat',
    'Assignee: A definir',
    ...(prioridade === undefined ? [] : [`Priority: ${prioridade}`]),
    '',
  ].join('\n');

describe('FilaDeTarefas', () => {
  it('ordena da MENOR prioridade para a maior — no taskin, Priority é ordem', () => {
    // A regressão que este teste guarda é a fila do geohub copiada sem pensar:
    // lá ela ordena decrescente, e aqui isso entregaria a 006 (700) antes da
    // 010 (10) — exatamente a inversão da dependência que o commit f83f2a6
    // escreveu.
    const dir = comTarefas({
      'task-006-depois.md': tarefa('006', 'depende da 010', 'pending', 700),
      'task-010-antes.md': tarefa('010', 'destrava as outras', 'pending', 10),
    });
    expect(new FilaDeTarefas(dir).apurar().elegiveis.map((t) => t.id)).toEqual(['010', '006']);
  });

  it('lê os dois formatos de metadado que o taskin escreve', () => {
    // `Status: pending` é o que está em TASKS/ hoje; `- Status: pending` é o
    // outro estilo do taskin. Um padrão que só casasse um perderia a tarefa
    // inteira — e a perderia em silêncio, virando "desconhecido".
    const dir = comTarefas({
      'task-001-sem-traco.md': '# Task 001 — Sem traço\n\nStatus: pending\nPriority: 20\n',
      'task-002-com-traco.md': '# Task 002 - Com traço\n\n- Status: pending\n- Priority: 30\n',
    });
    const fila = new FilaDeTarefas(dir).apurar();
    expect(fila.elegiveis.map((t) => t.titulo)).toEqual(['Sem traço', 'Com traço']);
  });

  it('lê a dificuldade quando ela existe, e não inventa quando não existe', () => {
    const dir = comTarefas({
      'task-007-com.md': `${tarefa('007', 'com dificuldade', 'pending', 40)}Difficulty: 2\n`,
      'task-008-sem.md': tarefa('008', 'sem dificuldade', 'pending', 50),
    });
    const fila = new FilaDeTarefas(dir).apurar();
    expect(fila.elegiveis.map((t) => t.dificuldade)).toEqual([2, undefined]);
  });

  it('"sem prioridade" não vira prioridade zero — que aqui seria o primeiro lugar', () => {
    const dir = comTarefas({
      'task-001-sem.md': tarefa('001', 'nao classificada', 'pending'),
      'task-002-ok.md': tarefa('002', 'elegivel', 'pending', 500),
    });
    const fila = new FilaDeTarefas(dir).apurar();
    expect(fila.semPrioridade.map((t) => t.id)).toEqual(['001']);
    expect(fila.elegiveis.map((t) => t.id)).toEqual(['002']);
  });

  it('exclui tarefa fechada mesmo com a prioridade mais alta da fila', () => {
    const dir = comTarefas({ 'task-001-feita.md': tarefa('001', 'ja feita', 'done', 1) });
    expect(new FilaDeTarefas(dir).apurar().elegiveis).toHaveLength(0);
  });

  it('`in-review` NÃO é da fila: já foi feita e espera revisão humana', () => {
    const dir = comTarefas({ 'task-001-r.md': tarefa('001', 'em revisao', 'in-review', 10) });
    expect(new FilaDeTarefas(dir).apurar().elegiveis).toHaveLength(0);
  });

  it('status que o código não conhece é RELATADO, nunca descartado em silêncio', () => {
    const dir = comTarefas({
      'task-001-x.md': tarefa('001', 'status novo', 'aguardando-cliente', 500),
    });
    const servico = new FilaDeTarefas(dir);
    const fila = servico.apurar();
    expect(fila.statusDesconhecido.map((t) => t.status)).toEqual(['aguardando-cliente']);
    expect(servico.renderizar(fila)).toMatch(/status que este código não conhece/);
  });

  it('RESERVADA sai da fila elegível, e aparece no relatório com o motivo', () => {
    const dir = comTarefas({
      'task-010-minha.md': tarefa('010', 'refactor grande', 'pending', 10),
      'task-007-dele.md': tarefa('007', 'mapa do directus', 'pending', 40),
    });
    const fila = new FilaDeTarefas(dir, { '010': 'em andamento e minha' });
    const apurada = fila.apurar();
    expect(apurada.elegiveis.map((t) => t.id)).toEqual(['007']);
    expect(apurada.reservadas.map((t) => t.id)).toEqual(['010']);
    expect(fila.renderizar(apurada)).toMatch(/em andamento e minha/);
  });

  it('manda PARAR quando a fila elegível está vazia, em vez de sugerir o que sobrou', () => {
    // A falha que este teste guarda: uma fila vazia renderizada como tabela em
    // branco faz o agente concluir que deve pegar qualquer coisa.
    const dir = comTarefas({ 'task-010-minha.md': tarefa('010', 'reservada', 'pending', 10) });
    const servico = new FilaDeTarefas(dir, { '010': 'minha' });
    const texto = servico.renderizar(servico.apurar());
    expect(texto).toMatch(/NENHUMA tarefa aberta é sua/);
    expect(texto).toMatch(/Pare e relate/);
  });

  it('reservar id inexistente não quebra nem inventa tarefa', () => {
    const dir = comTarefas({ 'task-007-ok.md': tarefa('007', 'existe', 'pending', 40) });
    const apurada = new FilaDeTarefas(dir, { '999': 'não existe' }).apurar();
    expect(apurada.elegiveis.map((t) => t.id)).toEqual(['007']);
    expect(apurada.reservadas).toEqual([]);
  });

  it('a ordem escrita no prompt.md é a mesma que o código aplica', () => {
    // Duplicação estreita e deliberada: o prompt é o texto que o agente lê, o
    // código é o filtro que age. Este teste é o que impede os dois de divergirem
    // — e a divergência plausível aqui não é sutil, é a inversão da fila.
    const prompt = readFileSync(join(RAIZ_REPO, '.sandcastle', 'prompt.md'), 'utf8');
    expect(prompt).toMatch(/menor\b.*\bvence/i);
    expect(prompt).not.toMatch(/maior\b[^.\n]*\bvence/i);
  });
});
