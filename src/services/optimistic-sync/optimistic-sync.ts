import { computed, type Ref, shallowRef, type WritableComputedRef, watch } from 'vue';

/**
 * Reads back what was just written, while the prop has not come back yet.
 *
 * The three states the composition shares — `layoutOptions`, `layoutQuery` and
 * `selection` — are `useSync`: reading reads the **prop**, writing is an
 * `emit`. Directus stores it right away, but the prop only comes back when the
 * parent re-renders, on the next tick. Whoever writes in the meantime reads the
 * value **prior to both writes**, and publishes an object where the first one
 * does not exist.
 *
 * And almost every write here is of that shape, because it is the shape the
 * Directus layouts use. Their `syncRefProperty` — which is how `spacing`,
 * `cameraOptions`, `clusterData`, `displayTemplate`, `page`, `limit` and `sort`
 * are written in both embedded layouts — is literally
 * `ref.value = { ...ref.value, [key]: value }`, read in the Directus 10.13.1
 * package. Every one of those writes depends on the prop having come back.
 *
 * `src/index.test.ts` pins six pairs that used to get lost: a map option with a
 * grid option, two options of the map itself, `zoomOnClick` with an embedded
 * option, two query keys, one query key from each embedded layout, and marking
 * by marker with marking by checkbox.
 *
 * **What is NOT proven, and the measurement is explicit about it**: no
 * interface gesture I managed to drive on 10.13.1 puts two writes in the same
 * tick. The persistence e2e of both sections passes the same with and without
 * this module — it was run both ways on purpose, and the result is the same
 * preset. Between one click and the next the prop always came back. In other
 * words: this closes a real window in the code, not a defect observed on
 * screen. Whoever finds the gesture, write it down here.
 *
 * The mirror keeps the last published value and erases itself as soon as the
 * prop changes. From then on the real preset is in charge — including when it
 * comes back different from what we published, which is the case of a preset
 * restored from outside.
 *
 * The price, and it is a known one: if the parent **ignores** the write, the
 * prop does not change, the mirror does not erase itself and the screen keeps
 * showing the optimistic value. The Directus `usePreset` always accepts, so
 * that does not happen here — but it is what is given up in exchange for not
 * losing a write.
 */
export function useOptimisticWrite<Value>(target: Ref<Value>): WritableComputedRef<Value> {
  /*
   * The box around the value exists so `null` and `undefined` stay publishable
   * values: without it, publishing `undefined` would be indistinguishable from
   * having published nothing.
   */
  const published = shallowRef<{ value: Value } | null>(null);

  watch(target, () => {
    published.value = null;
  });

  return computed<Value>({
    get: () => (published.value ? published.value.value : target.value),
    set: (value) => {
      published.value = { value };
      target.value = value;
    },
  });
}
