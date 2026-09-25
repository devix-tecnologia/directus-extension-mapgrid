import type { IEmbeddedStateReader } from './embedded-state-reader.types';

/**
 * State keys the composition must not even touch.
 *
 * Measured on Directus 10.13.1: `showingCount` is a `computed` whose getter
 * calls `useI18n()`, and vue-i18n throws `MUST_BE_CALL_SETUP_TOP` when there is
 * no current instance. Once the key has been read successfully one single time
 * it becomes a dependency of our render effect, and Vue re-evaluates it — with
 * no current instance — while checking whether that effect is dirty. The throw
 * happens inside the check, the sweep dies halfway through, and the composition
 * stops repainting: that is what kept fresh `geojsonBounds` away from the map
 * after a fetch. A `try` around the read does not help, because we are not the
 * ones evaluating the getter.
 *
 * Nothing is lost: `showingCount` is the "1-25 of 132" text the Directus header
 * draws, and the MapGrid header builds its own from `itemCount` and
 * `totalCount`, in `src/index.ts`.
 */
export const KEYS_THAT_THROW_OUTSIDE_RENDER = ['showingCount'];

export class EmbeddedStateReader implements IEmbeddedStateReader {
  read(state?: Record<string, unknown> | null): Record<string, unknown> {
    if (!state) return {};

    const read: Record<string, unknown> = {};
    for (const key of Object.keys(state)) {
      if (KEYS_THAT_THROW_OUTSIDE_RENDER.includes(key)) continue;
      read[key] = state[key];
    }
    return read;
  }
}
