import type { Ref, WritableComputedRef } from 'vue';

/**
 * O que `useEscritaOtimista` recebe e devolve: a mesma forma de ref, para que
 * quem já escrevia no original não precise saber que há um espelho no meio.
 */
export type EscritaOtimista = <Valor>(alvo: Ref<Valor>) => WritableComputedRef<Valor>;
