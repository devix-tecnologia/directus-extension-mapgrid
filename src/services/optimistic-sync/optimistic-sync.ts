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
 * Directus usam. O `syncRefProperty` deles — que é como `spacing`,
 * `cameraOptions`, `clusterData`, `displayTemplate`, `page`, `limit` e `sort`
 * são escritos nos dois embutidos — é literalmente
 * `ref.value = { ...ref.value, [chave]: valor }`, lido no pacote do Directus
 * 10.13.1. Cada uma dessas escritas depende de o prop já ter voltado.
 *
 * `src/index.test.ts` fixa seis pares que se perdiam: opção do mapa com opção
 * da grade, duas opções do próprio mapa, `zoomOnClick` com opção de embutido,
 * duas chaves da consulta, uma chave da consulta de cada embutido, e marcação
 * do marcador com marcação da caixa.
 *
 * **O que NÃO está provado, e a medição é explícita nisto**: nenhum gesto de
 * interface que eu tenha conseguido dirigir no 10.13.1 põe duas escritas no
 * mesmo tick. O e2e de persistência das duas seções passa igual com e sem este
 * módulo — foi rodado nos dois estados de propósito, e o resultado é o mesmo
 * preset. Entre um clique e outro de uma pessoa o prop sempre voltou. Ou seja:
 * isto fecha uma janela real do código, não um defeito observado na tela. Quem
 * achar o gesto, anote aqui.
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
