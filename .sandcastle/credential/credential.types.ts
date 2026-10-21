/** Validates the token the Sandcastle agent uses to talk to Claude. */
export interface IClaudeToken {
  /** The token without the spaces and line breaks of a paste, or `null` when it is not a `claude setup-token` token. */
  normalise(raw: string): string | null;
}

/** Where the token is kept between one round and the next. */
export interface IKeyring {
  read(): string | null;
  write(token: string): void;
}
