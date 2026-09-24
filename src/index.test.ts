/**
 * As duas seções de `layoutOptions`, gravando no mesmo preset.
 *
 * O mapa guarda a configuração dele em `layoutOptions.map` e a grade em
 * `layoutOptions.tabular`, justamente para uma não sobrescrever a outra. O que
 * este arquivo mede é se a separação aguenta o caminho de volta: quem publica a
 * opção é um `emit`, e o valor só volta ao layout pelo **prop**, que no Vue só
 * muda quando o pai re-renderiza — no tick seguinte, não na hora.
 *
 * Por isso o Directus de mentira daqui atrasa o prop de propósito. Um duplo de
 * teste que devolvesse o valor na hora esconderia exatamente a janela onde as
 * duas seções se perdem, e o teste nasceria verde sem provar nada.
 */
import type { LayoutConfig, LayoutProps } from '@directus/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { CONTRATO_DOS_EMBUTIDOS } from './services/embedded-layout/index';

const registro = vi.hoisted(() => ({ layouts: [] as unknown[] }));

/**
 * O SDK do Directus, reduzido ao que o `setup()` usa. O `useSync` é o de
 * verdade — lê do prop, escreve por `emit` —, porque é dele que sai a janela
 * que este arquivo mede.
 */
vi.mock('@directus/extensions-sdk', async () => {
  const { computed: computar, ref: referencia } = await import('vue');

  return {
    defineLayout: (config: unknown) => config,
    useSync: (
      props: Record<string, unknown>,
      chave: string,
      emit: (evento: string, valor: unknown) => void
    ) =>
      computar({
        get: () => props[chave],
        set: (valor: unknown) => emit(`update:${chave}`, valor),
      }),
    useApi: () => ({ delete: () => Promise.resolve() }),
    useCollection: () => ({ fields: referencia([]), primaryKeyField: referencia(null) }),
    useExtensions: () => ({ layouts: computar(() => registro.layouts) }),
  };
});

const componenteVazio = defineComponent({
  name: 'ComponenteVazio',
  setup: () => () => h('div'),
});

/**
 * Um layout do Directus de mentira, escrito como os deles: as opções de vista
 * são computeds que leem e escrevem `layoutOptions` inteiro, uma chave por vez
 * (`{ ...layoutOptions.value, [chave]: valor }`). É essa forma — e não um
 * `emit` direto — que faz a opção anterior depender do que o prop já devolveu.
 */
function layoutDoDirectus(
  id: 'tabular' | 'map',
  opcoesDeVista: readonly string[],
  chavesDaConsulta: readonly string[] = []
): LayoutConfig {
  return {
    id,
    name: id,
    icon: 'box',
    component: componenteVazio,
    slots: { options: componenteVazio, sidebar: componenteVazio, actions: componenteVazio },
    setup(props: Record<string, unknown>, { emit }: { emit: (e: string, v: unknown) => void }) {
      const layoutOptions = computed<Record<string, unknown>>({
        get: () => (props.layoutOptions as Record<string, unknown>) ?? {},
        set: (valor) => emit('update:layoutOptions', valor),
      });

      const estado: Record<string, unknown> = {};
      for (const chave of CONTRATO_DOS_EMBUTIDOS[id]) estado[chave] = ref(undefined);
      estado.items = ref([]);

      for (const chave of opcoesDeVista) {
        estado[chave] = computed({
          get: () => layoutOptions.value[chave],
          set: (valor: unknown) => {
            layoutOptions.value = { ...layoutOptions.value, [chave]: valor };
          },
        });
      }

      /* A consulta é dos dois, e eles a escrevem do mesmo jeito: chave a chave. */
      const layoutQuery = computed<Record<string, unknown>>({
        get: () => (props.layoutQuery as Record<string, unknown>) ?? {},
        set: (valor) => emit('update:layoutQuery', valor),
      });

      for (const chave of chavesDaConsulta) {
        estado[chave] = computed({
          get: () => layoutQuery.value[chave],
          set: (valor: unknown) => {
            layoutQuery.value = { ...layoutQuery.value, [chave]: valor };
          },
        });
      }

      return estado;
    },
  } as unknown as LayoutConfig;
}

interface Composicao {
  preset: Record<string, unknown>;
  estado: Record<string, unknown>;
}

/**
 * Monta a composição contra um Directus de mentira que grava na hora e devolve
 * o prop no tick seguinte — que é o que o Vue faz.
 */
async function montarComposicao(): Promise<Composicao> {
  const { default: layout } = await import('./index');

  const preset: Record<string, unknown> = {
    layoutOptions: {},
    layoutQuery: {},
    selection: [],
  };

  const props = reactive<Record<string, unknown>>({
    collection: 'cidades',
    layoutOptions: preset.layoutOptions,
    layoutQuery: preset.layoutQuery,
    selection: preset.selection,
    filter: null,
    search: null,
  });

  const emit = (evento: string, valor: unknown): void => {
    const chave = evento.replace(/^update:/, '');
    preset[chave] = valor;
    void nextTick(() => {
      props[chave] = preset[chave];
    });
  };

  const setup = (layout as { setup: (p: LayoutProps, c: { emit: typeof emit }) => unknown }).setup;
  const estado = setup(props as unknown as LayoutProps, { emit }) as Record<string, unknown>;

  return { preset, estado };
}

const embutido = (composicao: Composicao, nome: 'grade' | 'mapa') =>
  composicao.estado[nome] as { state: Record<string, unknown> };

/** Grava uma opção pelo caminho que o painel de opções deles usa. */
const gravarOpcao = (
  composicao: Composicao,
  nome: 'grade' | 'mapa',
  chave: string,
  valor: unknown
): void => {
  const escrever = embutido(composicao, nome).state[`onUpdate:${chave}`];
  (escrever as (valor: unknown) => void)(valor);
};

const opcoesGravadas = (composicao: Composicao) =>
  composicao.preset.layoutOptions as Record<string, Record<string, unknown>>;

/** Dois ticks: um para o prop voltar, outro para quem observa o prop correr. */
const deixarOPresetVoltar = async (): Promise<void> => {
  await nextTick();
  await nextTick();
};

beforeEach(() => {
  registro.layouts = [
    layoutDoDirectus('tabular', ['spacing', 'align'], ['sort', 'page']),
    layoutDoDirectus('map', ['displayTemplate', 'basemap'], ['page']),
  ];
});

/** Grava uma chave da consulta pelo caminho que o layout embutido usa. */
const gravarConsulta = (
  composicao: Composicao,
  nome: 'grade' | 'mapa',
  chave: string,
  valor: unknown
): void => {
  const escrever = embutido(composicao, nome).state[`onUpdate:${chave}`];
  (escrever as (valor: unknown) => void)(valor);
};

const consultaGravada = (composicao: Composicao) =>
  composicao.preset.layoutQuery as Record<string, unknown>;

/** Marca um item pelo caminho que o marcador e a caixa de marcação usam. */
const marcar = (composicao: Composicao, nome: 'grade' | 'mapa', id: string | number): void => {
  const estado = embutido(composicao, nome).state;
  const marcados = (estado.selection ?? []) as (string | number)[];
  (estado['onUpdate:selection'] as (valor: unknown) => void)([...marcados, id]);
};

const selecaoGravada = (composicao: Composicao) => composicao.preset.selection;

describe('a seleção compartilhada não perde marcação no mesmo tick', () => {
  it('acumula o que o mapa marcou e o que a grade marcou', async () => {
    const composicao = await montarComposicao();

    marcar(composicao, 'mapa', 1);
    marcar(composicao, 'grade', 2);
    await deixarOPresetVoltar();

    expect(selecaoGravada(composicao)).toEqual([1, 2]);
  });
});

/**
 * A consulta tem a mesma janela que as opções, e alcança mais gente: mapa e
 * grade escrevem nela os dois, e `page`, `limit` e `sort` saem do mesmo
 * `syncRefProperty` deles. O componente de mapa do Directus 10.13.1, por
 * exemplo, escreve `limit` no próprio `setup()` — ou seja, já na montagem.
 */
describe('a consulta compartilhada não perde escrita no mesmo tick', () => {
  it('guarda duas chaves da consulta trocadas juntas pela grade', async () => {
    const composicao = await montarComposicao();

    gravarConsulta(composicao, 'grade', 'sort', ['-name']);
    gravarConsulta(composicao, 'grade', 'page', 1);
    await deixarOPresetVoltar();

    expect(consultaGravada(composicao).sort).toEqual(['-name']);
    expect(consultaGravada(composicao).page).toBe(1);
  });

  it('guarda a escrita do mapa e a da grade feitas no mesmo tick', async () => {
    const composicao = await montarComposicao();

    gravarConsulta(composicao, 'mapa', 'page', 2);
    gravarConsulta(composicao, 'grade', 'sort', ['-name']);
    await deixarOPresetVoltar();

    expect(consultaGravada(composicao).page).toBe(2);
    expect(consultaGravada(composicao).sort).toEqual(['-name']);
  });
});

describe('as seções de layoutOptions não se sobrescrevem', () => {
  it('guarda a opção de cada layout embutido na seção dele', async () => {
    const composicao = await montarComposicao();

    gravarOpcao(composicao, 'mapa', 'displayTemplate', '{{name}}');
    await deixarOPresetVoltar();
    gravarOpcao(composicao, 'grade', 'spacing', 'cozy');
    await deixarOPresetVoltar();

    expect(opcoesGravadas(composicao).map?.displayTemplate).toBe('{{name}}');
    expect(opcoesGravadas(composicao).tabular?.spacing).toBe('cozy');
  });

  it('não perde a seção do mapa quando a grade grava no mesmo tick', async () => {
    const composicao = await montarComposicao();

    gravarOpcao(composicao, 'mapa', 'displayTemplate', '{{name}}');
    gravarOpcao(composicao, 'grade', 'spacing', 'cozy');
    await deixarOPresetVoltar();

    expect(opcoesGravadas(composicao).map?.displayTemplate).toBe('{{name}}');
    expect(opcoesGravadas(composicao).tabular?.spacing).toBe('cozy');
  });

  it('não perde a opção anterior do próprio mapa gravada no mesmo tick', async () => {
    const composicao = await montarComposicao();

    gravarOpcao(composicao, 'mapa', 'displayTemplate', '{{name}}');
    gravarOpcao(composicao, 'mapa', 'basemap', 'Satellite');
    await deixarOPresetVoltar();

    expect(opcoesGravadas(composicao).map?.displayTemplate).toBe('{{name}}');
    expect(opcoesGravadas(composicao).map?.basemap).toBe('Satellite');
  });

  it('não perde o zoomOnClick da composição quando um embutido grava junto', async () => {
    const composicao = await montarComposicao();

    const zoomOnClick = composicao.estado.zoomOnClick as { value: boolean | undefined };
    zoomOnClick.value = true;
    gravarOpcao(composicao, 'grade', 'spacing', 'cozy');
    await deixarOPresetVoltar();

    expect(opcoesGravadas(composicao).zoomOnClick).toBe(true);
    expect(opcoesGravadas(composicao).tabular?.spacing).toBe('cozy');
  });
});
