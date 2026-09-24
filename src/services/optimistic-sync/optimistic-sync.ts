import { computed, type Ref, shallowRef, type WritableComputedRef, watch } from 'vue';

/**
 * Lê o que acabou de ser escrito, enquanto o prop não volta.
 *
 * Os três estados que a composição divide — `layoutOptions`, `layoutQuery` e
 * `selection` — são `useSync`: ler é ler o **prop**, escrever é `emit`. O
 * Directus grava na hora, mas o prop só volta quando o pai re-renderiza, no
 * tick seguinte. Quem escreve no meio desse intervalo lê o valor **anterior às
 * duas escritas**, e publica um objeto onde a primeira não existe.
 *
 * E quase toda escrita daqui é dessa forma, porque é a forma que os layouts do
 * Directus usam: `{ ...layoutQuery.value, sort }`, `{ ...layoutOptions.value,
 * [chave]: valor }`. Medido em `src/index.test.ts`:
 *
 * - ordenar pelo cabeçalho da grade deles troca `sort` e devolve `page` a 1 na
 *   mesma volta, e o `sort` sumia;
 * - gravar uma opção do mapa e uma da grade no mesmo tick deixava só a da
 *   grade no preset — as duas seções que existem justamente para não se
 *   sobrescreverem.
 *
 * O espelho guarda o último valor publicado e se apaga assim que o prop muda.
 * A partir daí quem manda é o preset de verdade — inclusive quando ele volta
 * diferente do que publicamos, que é o caso de um preset restaurado por fora.
 *
 * O preço, e ele é conhecido: se o pai **ignorar** a escrita, o prop não muda,
 * o espelho não se apaga e a tela segue mostrando o valor otimista. O
 * `usePreset` do Directus sempre aceita, então isso não acontece aqui — mas é o
 * que se perde em troca de não perder escrita.
 */
export function useEscritaOtimista<Valor>(alvo: Ref<Valor>): WritableComputedRef<Valor> {
  /*
   * A caixa em volta do valor existe para `null` e `undefined` continuarem
   * sendo valores publicáveis: sem ela, publicar `undefined` seria
   * indistinguível de não ter publicado nada.
   */
  const publicado = shallowRef<{ valor: Valor } | null>(null);

  watch(alvo, () => {
    publicado.value = null;
  });

  return computed<Valor>({
    get: () => (publicado.value ? publicado.value.valor : alvo.value),
    set: (valor) => {
      publicado.value = { valor };
      alvo.value = valor;
    },
  });
}
