/**
 * Tipos da fila de tarefas que o Sandcastle apresenta ao agente.
 *
 * Por que este módulo existe: o `taskin list` **não imprime a prioridade**. Ele
 * ordena por ID e mostra status, tipo, responsável e título. O agente decide por
 * `Priority`, então uma lista sem a coluna que a regra usa é escolher no escuro.
 *
 * A prioridade mora numa linha `Priority: N` do próprio markdown da tarefa, e é
 * de lá que se lê.
 */

/** Status que o taskin usa no cabeçalho da tarefa. */
export const StatusDeTarefa = {
  pendente: 'pending',
  aFazer: 'todo',
  emAndamento: 'in-progress',
  pausada: 'paused',
  bloqueada: 'blocked',
  emRevisao: 'in-review',
  feita: 'done',
  cancelada: 'canceled',
} as const satisfies Record<string, string>;

export type StatusDeTarefa = (typeof StatusDeTarefa)[keyof typeof StatusDeTarefa];

/**
 * Os status que contam como "aberta".
 *
 * `in-review` está de fora de propósito: a tarefa já foi feita e espera revisão
 * humana. Devolvê-la à fila faria o agente refazer trabalho pronto.
 */
export const STATUS_ABERTOS: readonly StatusDeTarefa[] = [
  StatusDeTarefa.pendente,
  StatusDeTarefa.aFazer,
  StatusDeTarefa.emAndamento,
  StatusDeTarefa.pausada,
  StatusDeTarefa.bloqueada,
];

/**
 * Uma tarefa lida do markdown.
 *
 * `prioridade` é `undefined` quando o arquivo não declara `Priority:`. Isso
 * **não** é o mesmo que prioridade zero — e, nesta fila, zero seria o primeiro
 * lugar. O tipo recusa a confusão.
 */
export interface TarefaNaFila {
  readonly id: string;
  readonly titulo: string;
  readonly status: StatusDeTarefa | 'desconhecido';
  readonly prioridade: number | undefined;
  readonly dificuldade: number | undefined;
  readonly arquivo: string;
}

/**
 * Tarefas que existem, estão abertas, mas **não são do agente** — alguém as
 * tomou para si, ou elas dependem de decisão que não é dele.
 *
 * A chave é o id da tarefa (`'010'`); o valor é o motivo, escrito por extenso.
 * O motivo é obrigatório de propósito: reserva sem justificativa é
 * indistinguível de esquecimento, e vira lista zumbi como qualquer allowlist.
 */
export type TarefasReservadas = Readonly<Record<string, string>>;

/**
 * O que a varredura produz.
 *
 * `semPrioridade` não é descartada em silêncio: é contada e relatada. Fila que
 * esconde o que omitiu faz o agente concluir que não há trabalho quando há.
 */
export interface FilaApurada {
  readonly elegiveis: readonly TarefaNaFila[];
  readonly semPrioridade: readonly TarefaNaFila[];
  readonly reservadas: readonly TarefaNaFila[];
  /**
   * Tarefas cujo status este código não conhece.
   *
   * Elas NÃO entram na fila — decidir por um status desconhecido seria adivinhar
   * —, mas são relatadas em voz alta.
   */
  readonly statusDesconhecido: readonly TarefaNaFila[];
}

export interface IFilaDeTarefas {
  /** Lê o diretório de tarefas e devolve a fila apurada. */
  apurar(): FilaApurada;
  /** Renderiza a fila apurada para o prompt do agente. */
  renderizar(fila: FilaApurada): string;
}
