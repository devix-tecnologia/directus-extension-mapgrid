/**
 * Reads the keys of an embedded layout's state so they can be handed to its
 * component.
 *
 * It exists to skip `KEYS_THAT_THROW_OUTSIDE_RENDER`; every other key is read
 * as is, and a getter that throws throws here too.
 */
export interface IEmbeddedStateReader {
  read(state?: Record<string, unknown> | null): Record<string, unknown>;
}
