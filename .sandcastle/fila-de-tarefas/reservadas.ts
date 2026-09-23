import type { TarefasReservadas } from './fila-de-tarefas.types.ts';

/**
 * Tarefas abertas que **não são do agente do Sandcastle**.
 *
 * Esta lista existe porque prioridade e destinatário são perguntas diferentes.
 * Mexer na `Priority` de uma tarefa só para escondê-la do agente mentiria no
 * campo que o taskin usa como ORDEM da fila — e a ordem aqui carrega
 * dependência entre tarefas, não preferência.
 *
 * ## O critério
 *
 * Vai para esta lista a tarefa cujo **instrumento de verificação o agente não
 * tem**, ou a que depende de decisão que não é dele. Não é uma lista de tarefas
 * difíceis nem de tarefas importantes: é a lista das que ele não teria como
 * provar, ou não teria como decidir.
 *
 * ## Manutenção
 *
 * Entrada cumprida **sai daqui**. Reserva esquecida é pior que reserva nenhuma:
 * ela some da fila do agente para sempre, em silêncio, e ninguém percebe porque
 * o efeito é uma ausência. O relatório da fila imprime esta lista inteira a cada
 * rodada justamente para que uma entrada zumbi fique visível.
 *
 * ## Por que está vazia em 2026-09-23
 *
 * As três tarefas abertas (010, 007, 006) são verificáveis aqui dentro: o
 * sandbox recebe o socket do Docker do host, então `pnpm test:e2e` — que é onde
 * a 010 se prova — roda de verdade. Se algum dia o socket sair, as três voltam
 * para cá.
 */
export const TAREFAS_RESERVADAS = {} as const satisfies TarefasReservadas;
