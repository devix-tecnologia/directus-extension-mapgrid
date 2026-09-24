import { describe, expect, it } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import { useEscritaOtimista } from './optimistic-sync';

/**
 * Um `useSync` do Directus, com a demora que ele tem de verdade: escrever
 * publica na hora, mas o valor lido só muda no tick seguinte — porque o que se
 * lê é um prop, e prop do Vue só muda quando o pai re-renderiza.
 */
function propComVoltaAtrasada<Valor>(inicial: Valor) {
  const prop = ref<Valor>(inicial);
  const publicado = ref<Valor>(inicial);

  const sincronizado = computed<Valor>({
    get: () => prop.value,
    set: (valor) => {
      publicado.value = valor;
      void nextTick(() => {
        prop.value = publicado.value;
      });
    },
  });

  return { sincronizado, publicado, prop };
}

describe('useEscritaOtimista', () => {
  it('lê o que acabou de ser escrito, antes de o prop voltar', () => {
    const { sincronizado } = propComVoltaAtrasada({ a: 1 });
    const espelhado = useEscritaOtimista(sincronizado);

    espelhado.value = { a: 2 };

    expect(sincronizado.value).toEqual({ a: 1 });
    expect(espelhado.value).toEqual({ a: 2 });
  });

  it('deixa duas escritas no mesmo tick se acumularem em vez de uma apagar a outra', async () => {
    const { sincronizado, publicado } = propComVoltaAtrasada<Record<string, number>>({});
    const espelhado = useEscritaOtimista(sincronizado);

    espelhado.value = { ...espelhado.value, primeira: 1 };
    espelhado.value = { ...espelhado.value, segunda: 2 };
    await nextTick();

    expect(publicado.value).toEqual({ primeira: 1, segunda: 2 });
  });

  it('volta a obedecer ao prop assim que ele muda por fora', async () => {
    const { sincronizado, prop } = propComVoltaAtrasada<Record<string, number>>({});
    const espelhado = useEscritaOtimista(sincronizado);

    espelhado.value = { otimista: 1 };
    await nextTick();

    /* O preset restaurado por fora, que é o que o botão de redefinir faz. */
    prop.value = { restaurado: 9 };
    await nextTick();

    expect(espelhado.value).toEqual({ restaurado: 9 });
  });

  it('publica `undefined` como valor, e não como ausência de escrita', () => {
    const { sincronizado } = propComVoltaAtrasada<number | undefined>(7);
    const espelhado = useEscritaOtimista(sincronizado);

    espelhado.value = undefined;

    expect(espelhado.value).toBeUndefined();
  });
});
