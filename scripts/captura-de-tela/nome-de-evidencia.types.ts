/**
 * Nomes de arquivo de evidência visual de uma task.
 *
 * Trazido de `geohub/scripts/captura-de-tela`, que é onde a equipe firmou a
 * convenção. Só a nomeação veio: o restante daquele módulo serve uma superfície
 * estática — um diretório materializado de uma revisão e servido numa porta — e
 * a nossa é o app do Directus, que exige login e a extensão construída. Quem
 * captura aqui é o próprio roteiro de Playwright, que já sabe entrar.
 *
 * A regra que originou a convenção (Sidarta, 2026-09-14): task que implementou
 * tela precisa ter a tela anexada como evidência, e quando a mudança for
 * melhoria ou correção de tela que já existia, a evidência traz **antes e
 * depois**.
 */

/** Uma evidência: de qual task, do quê, e em qual momento. */
export interface NomeDeEvidencia {
  /** O número da task, com ou sem o prefixo `task-`. */
  readonly task: string;
  /** O que a imagem mostra, em letras, números e hífen. */
  readonly rotulo: string;
  readonly momento?: 'antes' | 'depois';
}
