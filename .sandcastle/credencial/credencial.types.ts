/** Valida o token que o agente do Sandcastle usa para falar com o Claude. */
export interface ITokenDoClaude {
  /** O token sem os espaços e quebras de linha da cópia, ou `null` se não for um token do `claude setup-token`. */
  normalizar(bruto: string): string | null;
}

/** Onde o token fica guardado entre uma rodada e outra. */
export interface IChaveiro {
  ler(): string | null;
  gravar(token: string): void;
}
