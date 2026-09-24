// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, useAttrs } from 'vue';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { LayoutEmbutido } from '../../../services/embedded-layout/index';
import MapgridLayout from './MapgridLayout.vue';

/**
 * Um layout embutido de mentira: o componente dele não desenha nada, só guarda
 * os atributos que recebeu. É por eles que a composição fala com os layouts do
 * Directus — `onRowClick` e `handleClick` chegam assim — então é o que um teste
 * do template precisa enxergar.
 */
function embutidoFalso(id: string, state: Record<string, unknown>) {
  const recebidos: { atributos: Record<string, unknown> } = { atributos: {} };

  const component = defineComponent({
    name: `embutido-${id}`,
    inheritAttrs: false,
    setup() {
      recebidos.atributos = useAttrs();
      return () => h('div', { class: `embutido-${id}` });
    },
  });

  const embutido: LayoutEmbutido = { id, state, component, optionsComponent: null };
  return { embutido, recebidos };
}

const BRASILIA: [number, number] = [-47.9292, -15.7801];

interface Composicao {
  atributosDoMapa: Record<string, unknown>;
  atributosDaGrade: Record<string, unknown>;
  atualizarSelecao: ReturnType<typeof vi.fn>;
  handleClickDeles: ReturnType<typeof vi.fn>;
}

function montarComposicao(selecaoInicial: (string | number)[] = []): Composicao {
  const atualizarSelecao = vi.fn();
  const handleClickDeles = vi.fn();

  const mapa = embutidoFalso('map', {
    geometryField: 'location',
    selection: selecaoInicial,
    'onUpdate:selection': atualizarSelecao,
    handleClick: handleClickDeles,
    cameraOptions: { center: [0, 0], zoom: 3 },
    'onUpdate:cameraOptions': vi.fn(),
  });

  const grade = embutidoFalso('tabular', { items: [], onRowClick: vi.fn() });

  mount(MapgridLayout, {
    props: { grade: grade.embutido, mapa: mapa.embutido },
    global: { components: directusComponentStubs },
  });

  return {
    atributosDoMapa: mapa.recebidos.atributos,
    atributosDaGrade: grade.recebidos.atributos,
    atualizarSelecao,
    handleClickDeles,
  };
}

const clicarNoPonto = (composicao: Composicao, payload: unknown): void => {
  const handleClick = composicao.atributosDoMapa.handleClick as (payload: unknown) => void;
  handleClick(payload);
};

describe('MapgridLayout — o clique no ponto', () => {
  it('seleciona a linha da grade em vez de navegar para a tela do item', () => {
    const composicao = montarComposicao();

    clicarNoPonto(composicao, { id: 3, replace: false });

    expect(composicao.atualizarSelecao).toHaveBeenCalledWith([3]);
    expect(composicao.handleClickDeles).not.toHaveBeenCalled();
  });

  it('acrescenta à seleção que já existe, como a caixa de marcação da grade', () => {
    const composicao = montarComposicao([1]);

    clicarNoPonto(composicao, { id: 3 });

    expect(composicao.atualizarSelecao).toHaveBeenCalledWith([1, 3]);
  });

  it('desmarca o ponto que já estava selecionado', () => {
    const composicao = montarComposicao([1, 3]);

    clicarNoPonto(composicao, { id: 3 });

    expect(composicao.atualizarSelecao).toHaveBeenCalledWith([1]);
  });

  it('ignora o clique que não traz item, como o do mar aberto', () => {
    const composicao = montarComposicao([1]);

    clicarNoPonto(composicao, { id: undefined });
    clicarNoPonto(composicao, null);

    expect(composicao.atualizarSelecao).not.toHaveBeenCalled();
  });

  it('não toca no clique da linha, que continua enquadrando o item no mapa', () => {
    const composicao = montarComposicao();
    const atualizarCamera = vi.fn();
    const mapa = embutidoFalso('map', {
      geometryField: 'location',
      selection: [],
      'onUpdate:selection': vi.fn(),
      cameraOptions: { center: [0, 0], zoom: 3 },
      'onUpdate:cameraOptions': atualizarCamera,
    });
    const grade = embutidoFalso('tabular', { items: [] });

    mount(MapgridLayout, {
      props: { grade: grade.embutido, mapa: mapa.embutido },
      global: { components: directusComponentStubs },
    });

    const onRowClick = grade.recebidos.atributos.onRowClick as (payload: unknown) => void;
    onRowClick({ item: { id: 1, location: { type: 'Point', coordinates: BRASILIA } } });

    expect(atualizarCamera).toHaveBeenCalledWith(
      expect.objectContaining({ center: [BRASILIA[0], BRASILIA[1]] })
    );
    expect(composicao.atributosDaGrade.onRowClick).toBeTypeOf('function');
  });
});
