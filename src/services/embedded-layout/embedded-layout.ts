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

  const embutido: LayoutEmbutido = {
    id,
    state,
    component: layout.component ?? null,
    optionsComponent: layout.slots?.options ?? null,
  };

  relatarContrato(embutido);

  return embutido;
}

/**
 * Grita o que faltou, e é de propósito que grite em vez de explodir.
 *
 * Derrubar a tela por uma chave renomeada trocaria uma composição meio quebrada
 * por nenhuma composição, e quem usa a extensão não ganha nada com isso. O que
 * não pode é a falta passar em silêncio: a mensagem no console é o que o
 * `tests/e2e/mapgrid-contrato.spec.ts` observa contra o Directus de verdade,
 * onde o defeito apareceria primeiro.
 */
function relatarContrato(embutido: LayoutEmbutido): void {
  const faltando = conferirContrato(embutido);
  if (faltando.length === 0) return;

  console.error(
    `${MARCA_DO_CONTRATO}: o layout "${embutido.id}" do Directus não devolveu ${faltando.join(', ')}. ` +
      'A composição do MapGrid lê essas chaves; sem elas ela degrada em silêncio.'
  );
}

/**
 * O que a composição LÊ de cada layout embutido.
 *
 * Nenhuma dessas chaves é API pública do Directus: elas são o retorno do
 * `setup()` de layouts que não foram feitos para rodar embutidos. Uma
 * atualização que renomeie qualquer uma delas não levanta exceção — a grade
 * fica vazia, a paginação trava em uma página, o clique na linha volta a
 * navegar para fora, o mapa não acha a geometria. Falha silenciosa, e longe da
 * causa.
 *
 * Por isso a lista mora aqui e é conferida a cada embutida. Cada chave tem
 * chamador nosso:
 *
 * - `items`, `loading`, `error`, `totalPages`, `itemCount`, `totalCount` e
 *   `refresh` são o que `src/index.ts` devolve ao app para desenhar contagem,
 *   paginação e as ações em lote;
 * - `tableHeaders`, `tableSort` e `onSortChange` são o menu de cabeçalho da
 *   grade deles, que é metade do que esta task foi buscar;
 * - `onRowClick` e `handleClick` são as duas chaves que o
 *   `MapgridLayout.vue` **sobrescreve**: some a chave, some a sobrescrita, e o
 *   clique volta a levar a pessoa para fora do MapGrid;
 * - `geometryField`, `geojson`, `cameraOptions` e `fitDataBounds` são o mapa.
 *
 * Os valores vêm da medição de 2026-09-24 contra o Directus 10.13.1, conferida
 * pelo `tests/e2e/mapgrid-contrato.spec.ts` — é lá que o Directus de verdade
 * entra, e é ele que reprova quando uma versão nova muda o retorno.
 */
export const CONTRATO_DOS_EMBUTIDOS = {
  tabular: [
    'items',
    'loading',
    'error',
    'totalPages',
    'itemCount',
    'totalCount',
    'refresh',
    'tableHeaders',
    'tableSort',
    'onSortChange',
    'onRowClick',
  ],
  map: [
    'items',
    'geojson',
    'geometryField',
    'cameraOptions',
    'fitDataBounds',
    'handleClick',
    'refresh',
  ],
} as const satisfies Record<string, readonly string[]>;

/**
 * O painel de opções entra no contrato pelo mesmo motivo que as chaves: sem
 * `slots.options` a barra lateral perde a configuração nativa dos dois layouts,
 * e o MapGrid vira uma composição que não se configura.
 */
export const SLOT_DE_OPCOES = 'slots.options';

/** O prefixo pelo qual o e2e reconhece a falha no console do navegador. */
export const MARCA_DO_CONTRATO = '[mapgrid] contrato quebrado';

type IdComContrato = keyof typeof CONTRATO_DOS_EMBUTIDOS;

const temContrato = (id: string): id is IdComContrato => id in CONTRATO_DOS_EMBUTIDOS;

/**
 * O que falta de um layout embutido para a composição funcionar.
 *
 * Confere a **presença** da chave, não o valor: `cameraOptions` nasce sem valor
 * enquanto ninguém mexeu na câmera e `error` fica nulo sem erro, então exigir
 * valor daria alarme falso em toda primeira visita. O que se mede é se o
 * Directus ainda devolve a chave com aquele nome.
 */
export function conferirContrato(embutido: LayoutEmbutido | null): string[] {
  if (!embutido || !temContrato(embutido.id)) return [];

  const faltando = CONTRATO_DOS_EMBUTIDOS[embutido.id].filter(
    (chave) => !(chave in embutido.state)
  );

  return embutido.optionsComponent ? faltando : [...faltando, SLOT_DE_OPCOES];
}

/** Os ids que a composição precisa encontrar no registro do app. */
export const LAYOUTS_EMBUTIDOS = { grade: 'tabular', mapa: 'map' } as const;

export const layoutEstaRegistrado = (registro: RegistroDeLayouts, id: string): boolean =>
  registro.some((layout) => layout.id === id);
