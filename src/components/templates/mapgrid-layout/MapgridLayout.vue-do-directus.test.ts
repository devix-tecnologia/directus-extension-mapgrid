// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  reactive,
  ref,
  useAttrs,
  version,
} from 'vue';
import { directusComponentStubs } from '../../../mocks/directus-mocks';
import type { LayoutEmbutido } from '../../../services/embedded-layout/index';
import MapgridLayout from './MapgridLayout.vue';

it('roda com o Vue do Directus que o e2e usa, e não com o do projeto', () => {
  expect(version).toBe('3.4.27');
});

/**
 * Sem esta guarda o arquivo inteiro mente: se o `mount` montar com outro Vue, o
 * estado que o teste cria é de uma reatividade e o efeito de render é de outra,
 * nada propaga, e todo teste de componente aqui reprova sem defeito nenhum.
 */
it('monta com esse mesmo Vue: uma reatividade só, não duas', () => {
  const componente = defineComponent({ setup: () => () => h('div') });
  const app = (mount(componente).vm.$ as { appContext: { app: { version: string } } }).appContext
    .app;
  expect(app.version).toBe(version);
});

function embutidoFalso(id: string, state: Record<string, unknown>) {
  const recebidos: { atributos: Record<string, unknown> } = { atributos: {} };
  const component = defineComponent({
    inheritAttrs: false,
    name: `embutido-${id}`,
    setup() {
      recebidos.atributos = useAttrs();
      return () => h('div', { class: `embutido-${id}` });
    },
  });
  const embutido: LayoutEmbutido = { component, id, optionsComponent: null, state };
  return { embutido, recebidos };
}

describe('geometria nativa: entregar ao mapa depois de buscar a geometria que a grade não trouxe', () => {
  const RIO_SP = {
    coordinates: [
      [-43.1729, -22.9068],
      [-46.6333, -23.5505],
    ],
    type: 'LineString',
  };
  const MANAUS_BELEM = {
    coordinates: [
      [-60.0255, -3.119],
      [-48.5044, -1.4558],
    ],
    type: 'LineString',
  };
  const esperarBusca = () => new Promise((resolver) => setTimeout(resolver, 0));

  it('depois de um primeiro voo, o layout de mapa recebe o bounds do item buscado', async () => {
    const boundsRecebidos: unknown[] = [];
    const layoutDeMapa = defineComponent({
      inheritAttrs: false,
      props: { geojsonBounds: { default: undefined, type: null } },
      setup(props) {
        return () => {
          boundsRecebidos.push(props.geojsonBounds);
          return h('div');
        };
      },
    });
    const featureDe = (id: number, geometry: unknown) => ({
      geometry,
      properties: { id },
      type: 'Feature',
    });
    // como o embutirLayout: o retorno do setup() deles, com refs, dentro de um reactive
    const estado = reactive<Record<string, unknown>>({
      cameraOptions: ref<unknown>(undefined),
      featureId: ref('id'),
      fitDataBounds: vi.fn(),
      geojson: ref({
        bbox: [-60.0255, -23.5505, -43.1729, -1.4558],
        features: [featureDe(1, RIO_SP), featureDe(2, MANAUS_BELEM)],
        type: 'FeatureCollection',
      }),
      geojsonBounds: ref<unknown>(undefined),
      geometryField: ref('trajeto'),
      isGeometryFieldNative: ref(true),
      selection: ref([]),
    });
    const mapa: LayoutEmbutido = {
      component: layoutDeMapa,
      id: 'map',
      optionsComponent: null,
      state: estado,
    };
    const grade = embutidoFalso('tabular', {
      items: [
        { id: 1, name: 'Rio → São Paulo' },
        { id: 2, name: 'Manaus → Belém' },
      ],
    });
    const buscarItens = vi.fn(async () => [{ id: 2, trajeto: MANAUS_BELEM }]);
    mount(MapgridLayout, {
      props: { buscarItens, grade: grade.embutido, mapa },
      global: { components: directusComponentStubs },
    });
    const onRowClick = grade.recebidos.atributos.onRowClick as (payload: unknown) => void;

    // o clique chega antes do moveend do carregamento, como no e2e
    onRowClick({ item: { id: 1, name: 'Rio → São Paulo' } });
    await nextTick();
    estado.cameraOptions = { bbox: [-180, -85, 180, 85], zoom: 1 };
    await nextTick();

    // o voo terminou em Rio–SP, e o Directus rebuscou só o que está na tela
    estado.cameraOptions = { bbox: [-47.7, -24.1, -42.1, -22.3], zoom: 8 };
    estado.geojson = {
      bbox: [-46.6333, -23.5505, -43.1729, -22.9068],
      features: [featureDe(1, RIO_SP)],
      type: 'FeatureCollection',
    };
    await nextTick();

    onRowClick({ item: { id: 2, name: 'Manaus → Belém' } });
    await esperarBusca();
    await nextTick();

    expect(buscarItens).toHaveBeenCalledWith([2], ['id', 'trajeto']);
    expect(boundsRecebidos[boundsRecebidos.length - 1]).toEqual([
      -60.0255, -3.119, -48.5044, -1.4558,
    ]);
  });
});

/**
 * O `showingCount` do layout de mapa do Directus chama `useI18n()` de dentro do
 * getter de um `computed`. Fora de um render não há instância corrente, e o
 * vue-i18n levanta um `SyntaxError` — é o erro que o e2e registra no console a
 * cada busca filtrada pela área visível.
 *
 * E o getter é avaliado fora do render: o agendador do Vue, antes de repintar,
 * pergunta ao efeito se ele está sujo, e essa pergunta reavalia os `computed`
 * dos quais ele depende sem instância corrente nenhuma. Se a explosão atravessa
 * a nossa leitura do estado, ela derruba a pergunta inteira — a composição não
 * repinta mais, e o `geojsonBounds` novo nunca chega ao mapa.
 */
describe('um getter do estado embutido que explode fora do render', () => {
  it('não impede a entrega seguinte ao mapa', async () => {
    const boundsRecebidos: unknown[] = [];
    const layoutDeMapa = defineComponent({
      inheritAttrs: false,
      props: { geojsonBounds: { default: undefined, type: null } },
      setup(props) {
        return () => {
          boundsRecebidos.push(props.geojsonBounds);
          return h('div');
        };
      },
    });
    const naTela = ref(2);
    /*
     * Armado só depois da montagem porque o `mount` do @vue/test-utils
     * vasculha os props em busca de refs e leria o getter fora do render ele
     * mesmo — a explosão seria do arranjo, e não do que se quer medir.
     */
    let armado = false;
    const estado = reactive<Record<string, unknown>>({
      geojsonBounds: ref<unknown>(undefined),
      showingCount: computed(() => {
        if (armado && getCurrentInstance() === null) {
          throw new SyntaxError('Must be called at the top of a `setup` function');
        }
        return `1-${naTela.value} of ${naTela.value}`;
      }),
    });
    const mapa: LayoutEmbutido = {
      component: layoutDeMapa,
      id: 'map',
      optionsComponent: null,
      state: estado,
    };
    const grade = embutidoFalso('tabular', { items: [] });
    mount(MapgridLayout, {
      props: { grade: grade.embutido, mapa },
      global: { components: directusComponentStubs },
    });

    armado = true;

    // a busca filtrada pela área visível muda a contagem, e só ela
    naTela.value = 1;
    await nextTick();

    // a geometria buscada chega depois, como no clique numa linha fora da tela
    estado.geojsonBounds = [-60.0255, -3.119, -48.5044, -1.4558];
    await nextTick();

    expect(boundsRecebidos[boundsRecebidos.length - 1]).toEqual([
      -60.0255, -3.119, -48.5044, -1.4558,
    ]);
  });
});
