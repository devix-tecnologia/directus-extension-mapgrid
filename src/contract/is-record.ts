/**
 * Um objeto com chaves de texto — o que sobra de `unknown` depois de descartar
 * primitivos, `null` e arrays.
 *
 * Existe porque o TypeScript não estreita `unknown` para `Record<string, unknown>`
 * sozinho depois de um `typeof value === 'object' && value !== null`: sem este
 * predicado, todo parser da fronteira precisaria de um `as` para ler a primeira
 * chave, que é justamente o que os parsers existem para evitar.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
