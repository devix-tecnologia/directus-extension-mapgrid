import { describe, expect, it } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import { useOptimisticWrite } from './optimistic-sync';

/**
 * A Directus `useSync`, with the delay it really has: writing publishes right
 * away, but the value read only changes on the next tick — because what is read
 * is a prop, and a Vue prop only changes when the parent re-renders.
 */
function propWithDelayedReturn<Value>(initial: Value) {
  const prop = ref<Value>(initial);
  const published = ref<Value>(initial);

  const synced = computed<Value>({
    get: () => prop.value,
    set: (value) => {
      published.value = value;
      void nextTick(() => {
        prop.value = published.value;
      });
    },
  });

  return { synced, published, prop };
}

describe('useOptimisticWrite', () => {
  it('reads what was just written, before the prop comes back', () => {
    const { synced } = propWithDelayedReturn({ a: 1 });
    const mirrored = useOptimisticWrite(synced);

    mirrored.value = { a: 2 };

    expect(synced.value).toEqual({ a: 1 });
    expect(mirrored.value).toEqual({ a: 2 });
  });

  it('lets two writes in the same tick pile up instead of one erasing the other', async () => {
    const { synced, published } = propWithDelayedReturn<Record<string, number>>({});
    const mirrored = useOptimisticWrite(synced);

    mirrored.value = { ...mirrored.value, first: 1 };
    mirrored.value = { ...mirrored.value, second: 2 };
    await nextTick();

    expect(published.value).toEqual({ first: 1, second: 2 });
  });

  it('obeys the prop again as soon as it changes from outside', async () => {
    const { synced, prop } = propWithDelayedReturn<Record<string, number>>({});
    const mirrored = useOptimisticWrite(synced);

    mirrored.value = { optimistic: 1 };
    await nextTick();

    /* The preset restored from outside, which is what the reset button does. */
    prop.value = { restored: 9 };
    await nextTick();

    expect(mirrored.value).toEqual({ restored: 9 });
  });

  it('publishes `undefined` as a value, and not as the absence of a write', () => {
    const { synced } = propWithDelayedReturn<number | undefined>(7);
    const mirrored = useOptimisticWrite(synced);

    mirrored.value = undefined;

    expect(mirrored.value).toBeUndefined();
  });
});
