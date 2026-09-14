/**
 * An object with string keys — what is left of `unknown` once primitives,
 * `null` and arrays are ruled out.
 *
 * It exists because TypeScript does not narrow `unknown` to
 * `Record<string, unknown>` on its own after a
 * `typeof value === 'object' && value !== null`: without this predicate every
 * parser at the boundary would need an `as` to read its first key, which is
 * exactly what the parsers exist to avoid.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
