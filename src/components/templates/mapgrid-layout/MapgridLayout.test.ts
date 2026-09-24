// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, useAttrs } from 'vue';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { LayoutEmbutido } from '../../../services/embedded-layout/index';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
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

  it('o clique na linha leva o mapa até o item pelo fitBounds do Directus, e não pelo cameraOptions', () => {
    const composicao = montarComposicao();
    const atualizarCamera = vi.fn();
    const geojson = {
      bbox: [-74, -34, -34, 5],
      features: [
        {
          geometry: { coordinates: BRASILIA, type: 'Point' },
          properties: { id: 1 },
          type: 'Feature',
        },
      ],
      type: 'FeatureCollection',
    };
    const mapa = embutidoFalso('map', {
      featureId: 'id',
      geometryField: 'location',
      geojson,
      geojsonBounds: undefined,
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

    const [oeste, sul, leste, norte] = geojson.bbox as [number, number, number, number];
    expect(oeste).toBeLessThanOrEqual(BRASILIA[0]);
    expect(leste).toBeGreaterThanOrEqual(BRASILIA[0]);
    expect(sul).toBeLessThanOrEqual(BRASILIA[1]);
    expect(norte).toBeGreaterThanOrEqual(BRASILIA[1]);
    expect(mapa.embutido.state.geojsonBounds).toEqual(geojson.bbox);
    expect(atualizarCamera).not.toHaveBeenCalled();
    expect(composicao.atributosDaGrade.onRowClick).toBeTypeOf('function');
  });

  it('enquanto o mapa carrega, insiste no bounds até o moveend do Directus gravar a câmera', async () => {
    vi.useFakeTimers();
    try {
      montarComposicao();
      const bboxDaColecao = [-74, -34, -34, 5];
      const geojson = {
        bbox: [...bboxDaColecao],
        features: [
          {
            geometry: { coordinates: BRASILIA, type: 'Point' },
            properties: { id: 1 },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      };
      const estado = reactive<Record<string, unknown>>({
        cameraOptions: { center: [0, 0], zoom: 3 },
        geojson,
        geojsonBounds: undefined,
        featureId: 'id',
        geometryField: 'location',
        selection: [],
      });
      const mapa = embutidoFalso('map', estado);
      const grade = embutidoFalso('tabular', { items: [] });
      mount(MapgridLayout, {
        props: { grade: grade.embutido, mapa: mapa.embutido },
        global: { components: directusComponentStubs },
      });

      const onRowClick = grade.recebidos.atributos.onRowClick as (payload: unknown) => void;
      onRowClick({ item: { id: 1, location: { type: 'Point', coordinates: BRASILIA } } });
      const primeiro = estado.geojsonBounds;
      await vi.advanceTimersByTimeAsync(300);
      expect(estado.geojsonBounds).not.toBe(primeiro);

      estado.cameraOptions = { bbox: [-49, -17, -46, -14], center: BRASILIA, zoom: 8 };
      await nextTick();
      const ultimo = estado.geojsonBounds;
      await vi.advanceTimersByTimeAsync(1_000);
      expect(estado.geojsonBounds).toBe(ultimo);
      expect(estado.geojson).toMatchObject({ bbox: bboxDaColecao });
    } finally {
      vi.useRealTimers();
    }
  });

  it('o reenquadrar da toolbar enquadra a coleção, mesmo com um clique na linha ainda pendente', async () => {
    vi.useFakeTimers();
    try {
      montarComposicao();
      const bboxDaColecao = [-74, -34, -34, 5];
      let bboxLidoPeloDirectus: unknown;
      const estado = reactive<Record<string, unknown>>({
        cameraOptions: { center: [0, 0], zoom: 3 },
        fitDataBounds: vi.fn(() => {
          bboxLidoPeloDirectus = [...(estado.geojson as { bbox: number[] }).bbox];
        }),
        geojson: {
          bbox: [...bboxDaColecao],
          features: [
            {
              geometry: { coordinates: BRASILIA, type: 'Point' },
              properties: { id: 1 },
              type: 'Feature',
            },
          ],
          type: 'FeatureCollection',
        },
        geojsonBounds: undefined,
        geometryField: 'location',
        selection: [],
      });
      const mapa = embutidoFalso('map', estado);
      const grade = embutidoFalso('tabular', { items: [] });
      const wrapper = mount(MapgridLayout, {
        props: { grade: grade.embutido, mapa: mapa.embutido },
        global: { components: directusComponentStubs },
      });

      const onRowClick = grade.recebidos.atributos.onRowClick as (payload: unknown) => void;
      onRowClick({ item: { id: 1, location: { type: 'Point', coordinates: BRASILIA } } });
      wrapper.findComponent(MapToolbar).vm.$emit('reset');

      expect(estado.fitDataBounds).toHaveBeenCalledOnce();
      expect(bboxLidoPeloDirectus).toEqual(bboxDaColecao);
    } finally {
      vi.useRealTimers();
    }
  });

  it('o clique na linha enquadra pela feature do Directus, mesmo com o campo em csv', () => {
    montarComposicao();
    const trajeto = {
      coordinates: [
        [-40.1, -20.1],
        [-39.7, -19.8],
      ],
      type: 'LineString',
    };
    const geojson = {
      bbox: [-74, -34, -34, 5],
      features: [{ geometry: trajeto, properties: { id: 3 }, type: 'Feature' }],
      type: 'FeatureCollection',
    };
    const mapa = embutidoFalso('map', {
      cameraOptions: { center: [0, 0], zoom: 3 },
      featureId: 'id',
      geojson,
      geojsonBounds: undefined,
      geometryField: 'local',
      selection: [],
    });
    const grade = embutidoFalso('tabular', { items: [] });
    mount(MapgridLayout, {
      props: { grade: grade.embutido, mapa: mapa.embutido },
      global: { components: directusComponentStubs },
    });

    const onRowClick = grade.recebidos.atributos.onRowClick as (payload: unknown) => void;
    onRowClick({ item: { id: 3, local: '-40.1,-20.1' } });

    expect(geojson.bbox).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });
});
