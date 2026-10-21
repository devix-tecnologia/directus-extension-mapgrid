import type { Ref, WritableComputedRef } from 'vue';

/**
 * What `useOptimisticWrite` takes and returns: the same ref shape, so whoever
 * already wrote to the original need not know there is a mirror in between.
 */
export type OptimisticWrite = <Value>(target: Ref<Value>) => WritableComputedRef<Value>;
