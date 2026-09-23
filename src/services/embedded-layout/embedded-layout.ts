import { reactive, toRefs } from 'vue';
import type { LayoutEmbutido, OpcoesDeEmbutir, RegistroDeLayouts } from './embedded-layout.types';

/**
 * Roda o `setup()` de um layout do Directus fora do `createLayoutWrapper`.
 *
 * O helper oficial devolve um componente que não desenha nada: ele chama
 * `layout.setup(props, { emit })` e entrega o resultado por um slot. Aqui é a
 * mesma chamada, sem o componente no meio — e a diferença importa. O Directus
 * entrega o retorno do `setup()` do NOSSO layout tanto ao componente quanto ao
 * painel de opções, que são irmãos na árvore. Nascendo aqui, o estado alcança
 * os dois; nascendo dentro do componente, o painel ficaria de fora e precisaria
 * de um segundo wrapper — com estado separado e uma busca a mais.
 */
export function embutirLayout({
  id,
  registro,
  props,
  emit,
}: OpcoesDeEmbutir): LayoutEmbutido | null {
  const layout = registro.find((candidato) => candidato.id === id);
  if (!layout || typeof layout.setup !== 'function') return null;

  /*
   * `...toRefs(props)` junto do retorno, como o `createLayoutWrapper` faz: o
   * componente do layout espera receber os próprios props de volta, e sem eles
   * caminhos menos comuns quebram.
   */
  const state = reactive({
    ...layout.setup(props, { emit }),
    ...toRefs(props),
  }) as Record<string, unknown>;

  /*
   * Os `onUpdate:<chave>`, também como o helper: chave que é prop sobe como
   * emit, chave que não é fica no estado local.
   */
  for (const chave of Object.keys(state)) {
    state[`onUpdate:${chave}`] = (valor: unknown) => {
      if (chave in props) emit(`update:${chave}`, valor);
      else state[chave] = valor;
    };
  }

  return {
    id,
    state,
    component: layout.component ?? null,
    optionsComponent: layout.slots?.options ?? null,
  };
}

/** Os ids que a composição precisa encontrar no registro do app. */
export const LAYOUTS_EMBUTIDOS = { grade: 'tabular', mapa: 'map' } as const;

export const layoutEstaRegistrado = (registro: RegistroDeLayouts, id: string): boolean =>
  registro.some((layout) => layout.id === id);
