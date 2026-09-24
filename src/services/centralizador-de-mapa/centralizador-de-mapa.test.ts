import { describe, expect, it } from 'vitest';
import { CentralizadorDoMapaDirectus } from './centralizador-de-mapa';
import type { Retangulo } from './centralizador-de-mapa.types';

/*
 * O estado aqui imita o que o `setup()` do layout de mapa do Directus devolve,
 * só nas três chaves que o contorno toca: `geojson` (com o `bbox` que o
 * componente do mapa lê no `fitBounds`), `geojsonBounds` (o que o componente
 * observa) e `cameraOptions` (onde ele grava a área visível a cada `moveend`).
 */
const VISIVEL: Retangulo = [-40.4, -20.4, -40.2, -20.2];
const TELA = { largura: 1000, altura: 600 };

interface OpcoesDeMontagem {
  /** O mapa já foi visto se movendo — o `watch` de `bounds` do Directus existe. */
  pronto?: boolean;
  visivel?: Retangulo | null;
  /** A câmera sem `bbox`, como a do preset antes do primeiro `moveend`. */
  camera?: Record<string, unknown>;
}

function montar({ camera, pronto = true, visivel = VISIVEL }: OpcoesDeMontagem = {}) {
  const bboxDaColecao: Retangulo = [-41, -21, -39, -19];
  const estado: Record<string, unknown> = {
    cameraOptions: camera ?? (visivel ? { bbox: [...visivel], zoom: 12 } : undefined),
    geojson: { bbox: [...bboxDaColecao], features: [], type: 'FeatureCollection' },
    geojsonBounds: undefined,
  };
  const pendentes: (() => void)[] = [];
  const repeticoes: { cancelada: boolean; intervalo: number; tarefa: () => void }[] = [];
  const centralizador = new CentralizadorDoMapaDirectus(estado, () => TELA, {
    depoisDaAtualizacao: (tarefa) => pendentes.push(tarefa),
    repetir: (tarefa, intervalo) => {
      const repeticao = { cancelada: false, intervalo, tarefa };
      repeticoes.push(repeticao);
      return () => {
        repeticao.cancelada = true;
      };
    },
  });
  if (pronto) centralizador.aoMoverACamera();
  const bboxLido = () => (estado.geojson as { bbox: Retangulo }).bbox;
  /** Um tique de cada repetição ainda ativa — o intervalo passando. */
  const tique = () => {
    for (const repeticao of repeticoes) if (!repeticao.cancelada) repeticao.tarefa();
  };
  const ativas = () => repeticoes.filter((repeticao) => !repeticao.cancelada);
  /** O `moveend` do Directus gravando a câmera nova no estado. */
  const moverACamera = (bbox: Retangulo) => {
    estado.cameraOptions = { bbox: [...bbox], zoom: 5 };
    centralizador.aoMoverACamera();
  };
  return {
    ativas,
    bboxDaColecao,
    bboxLido,
    centralizador,
    estado,
    moverACamera,
    pendentes,
    repeticoes,
    tique,
  };
}

const ponto = (lng: number, lat: number) => ({ coordinates: [lng, lat], type: 'Point' });

describe('centralizar um ponto', () => {
  it('fora da área visível: dispara o fitBounds do Directus trocando bounds', () => {
    const { centralizador, estado } = montar();
    expect(centralizador.centralizar(ponto(-40.0, -20.0))).toBe(true);
    expect(estado.geojsonBounds).toBeDefined();
  });

  it('o retângulo lido pelo fitBounds está centrado no ponto', () => {
    const { bboxDaColecao, bboxLido, centralizador } = montar();
    centralizador.centralizar(ponto(-40.0, -20.0));
    expect(bboxLido()).not.toEqual(bboxDaColecao);
    const [oeste, sul, leste, norte] = bboxLido();
    expect((oeste + leste) / 2).toBeCloseTo(-40.0, 6);
    // o centro em latitude é o da projeção de Mercator, não a média em graus
    expect(sul).toBeLessThan(-20.0);
    expect(norte).toBeGreaterThan(-20.0);
  });

  it('mantém o zoom: o retângulo é a área visível menos o padding de 100 px do Directus', () => {
    const { bboxLido, centralizador } = montar();
    centralizador.centralizar(ponto(-40.0, -20.0));
    const [oeste, , leste] = bboxLido();
    const larguraVisivel = VISIVEL[2] - VISIVEL[0];
    expect(leste - oeste).toBeCloseTo((larguraVisivel * (TELA.largura - 200)) / TELA.largura, 9);
  });

  it('devolve o bbox da coleção depois da atualização, para o "enquadrar tudo" não herdar o do ponto', () => {
    const { bboxDaColecao, bboxLido, centralizador, pendentes } = montar();
    centralizador.centralizar(ponto(-40.0, -20.0));
    expect(bboxLido()).not.toEqual(bboxDaColecao);
    for (const tarefa of pendentes) tarefa();
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('não troca o objeto geojson: o watch de data do Directus não reenvia a coleção', () => {
    const { centralizador, estado } = montar();
    const antes = estado.geojson;
    centralizador.centralizar(ponto(-40.0, -20.0));
    expect(estado.geojson).toBe(antes);
  });

  it('cada centralização entrega um bounds novo, para o watch disparar de novo', () => {
    const { centralizador, estado, pendentes } = montar();
    centralizador.centralizar(ponto(-40.0, -20.0));
    const primeiro = estado.geojsonBounds;
    for (const tarefa of pendentes) tarefa();
    centralizador.centralizar(ponto(-40.0, -20.0));
    expect(estado.geojsonBounds).not.toBe(primeiro);
  });

  it('dentro da área visível: não mexe em nada', () => {
    const { bboxDaColecao, bboxLido, centralizador, estado } = montar();
    expect(centralizador.centralizar(ponto(-40.3, -20.3))).toBe(false);
    expect(estado.geojsonBounds).toBeUndefined();
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('dentro da área visível, com somenteSeFora: false, centraliza mesmo assim', () => {
    const { centralizador } = montar();
    expect(centralizador.centralizar(ponto(-40.3, -20.3), { somenteSeFora: false })).toBe(true);
  });
});

describe('aproximar ao centralizar', () => {
  it('com aproximar, o ponto vira o próprio retângulo e o fitBounds do Directus aproxima até o maxZoom dele', () => {
    const { bboxLido, centralizador } = montar();
    centralizador.centralizar(ponto(-40.0, -20.0), { aproximar: true, somenteSeFora: false });
    expect(bboxLido()).toEqual([-40.0, -20.0, -40.0, -20.0]);
  });

  it('aproximar não muda como uma linha é enquadrada', () => {
    const { bboxLido, centralizador } = montar();
    const linha = {
      coordinates: [
        [-40.1, -20.1],
        [-39.7, -19.8],
      ],
      type: 'LineString',
    };
    centralizador.centralizar(linha, { aproximar: true });
    expect(bboxLido()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });
});

describe('centralizar o que não é ponto', () => {
  it('uma linha é enquadrada pelo próprio retângulo, e não pelo primeiro vértice', () => {
    const { bboxLido, centralizador } = montar();
    const trajeto = {
      coordinates: [
        [-40.1, -20.1],
        [-39.9, -19.8],
        [-39.7, -19.9],
      ],
      type: 'LineString',
    };
    expect(centralizador.centralizar(trajeto)).toBe(true);
    expect(bboxLido()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });

  it('um polígono com furo e um multi-ponto também', () => {
    const { bboxLido, centralizador } = montar();
    centralizador.centralizar({
      coordinates: [
        [
          [-40.0, -20.0],
          [-39.5, -20.0],
          [-39.5, -19.5],
          [-40.0, -20.0],
        ],
      ],
      type: 'Polygon',
    });
    expect(bboxLido()).toEqual([-40.0, -20.0, -39.5, -19.5]);
  });
});

describe('o que não se lê não mexe na câmera', () => {
  it.each([
    ['nada', undefined],
    ['sem coordenadas', { type: 'Point' }],
    ['coordenada que não é número', { coordinates: ['a', 'b'], type: 'Point' }],
    ['latitude impossível', { coordinates: [-40, -95], type: 'Point' }],
  ])('%s', (_caso, geometria) => {
    const { bboxDaColecao, bboxLido, centralizador, estado } = montar();
    expect(centralizador.centralizar(geometria, { somenteSeFora: false })).toBe(false);
    expect(estado.geojsonBounds).toBeUndefined();
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('sem área visível, mas com o zoom da câmera, mantém esse zoom', () => {
    // o preset traz center e zoom; o bbox só chega no primeiro moveend. O mapa
    // nasceu com esse zoom (`new Map({ ...camera })`), e é ele que se mantém. No
    // MapLibre o mundo tem 512·2^zoom pixels de largura.
    const { bboxLido, centralizador } = montar({
      camera: { center: [-47.9, -15.8], zoom: 9 },
      visivel: null,
    });
    centralizador.centralizar(ponto(-40.0, -20.0), { somenteSeFora: false });
    const [oeste, sul, leste, norte] = bboxLido();
    const mundo = 512 * 2 ** 9;
    expect(leste - oeste).toBeCloseTo((360 * (TELA.largura - 200)) / mundo, 9);
    const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    expect(mercator(norte) - mercator(sul)).toBeCloseTo(
      (2 * Math.PI * (TELA.altura - 200)) / mundo,
      9
    );
  });

  it('sem área visível conhecida, o ponto é enquadrado pelo próprio retângulo', () => {
    // antes do primeiro moveend não há cameraOptions.bbox para manter o zoom;
    // o fitBounds deles aplica o maxZoom 14
    const { bboxLido, centralizador } = montar({ visivel: null });
    expect(centralizador.centralizar(ponto(-40.0, -20.0))).toBe(true);
    expect(bboxLido()).toEqual([-40.0, -20.0, -40.0, -20.0]);
  });
});

describe('antes de o mapa do Directus terminar de carregar', () => {
  /*
   * O `watch` de `bounds` do Directus só é registrado no `load` do MapLibre —
   * estilo e tiles baixados. Um clique que chega antes disso troca `bounds` sem
   * ninguém escutando, e a mudança se perde. Não há sinal de "carregou" fora do
   * componente; o que há é o `moveend`, que também só é ligado no `load`. Então,
   * enquanto a câmera nunca foi vista mudando, insiste.
   */
  it('insiste: entrega um bounds novo a cada intervalo, com o mesmo retângulo', () => {
    const { bboxLido, centralizador, estado, tique } = montar({ pronto: false });
    centralizador.centralizar(ponto(-40.0, -20.0));
    const primeiro = estado.geojsonBounds;
    tique();
    expect(estado.geojsonBounds).not.toBe(primeiro);
    expect(estado.geojsonBounds).toEqual(primeiro);
    expect(bboxLido()).toEqual(primeiro);
  });

  it('o bbox do alvo fica no geojson enquanto insiste — o fitBounds atrasado o lê', () => {
    const { bboxDaColecao, bboxLido, centralizador, pendentes, tique } = montar({
      pronto: false,
    });
    centralizador.centralizar(ponto(-40.0, -20.0));
    for (const tarefa of pendentes) tarefa();
    tique();
    expect(bboxLido()).not.toEqual(bboxDaColecao);
  });

  it('a primeira mudança de câmera encerra a insistência com um bounds a mais — o mapa agora escuta', () => {
    // esse moveend pode ser o do fitBounds inicial deles, dos dados, e não o
    // nosso: ver o alvo na tela não prova nada, uma visão de mundo contém tudo
    const { ativas, bboxDaColecao, bboxLido, centralizador, estado, moverACamera, pendentes } =
      montar({ pronto: false });
    centralizador.centralizar(ponto(-40.0, -20.0));
    const antes = estado.geojsonBounds;
    expect(ativas()).toHaveLength(1);
    moverACamera([-180, -85, 180, 85]);
    expect(estado.geojsonBounds).not.toBe(antes);
    expect(estado.geojsonBounds).toEqual(antes);
    expect(ativas()).toHaveLength(0);
    expect(bboxLido()).toEqual(antes);
    for (const tarefa of pendentes) tarefa();
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('desiste no prazo, e devolve o bbox da coleção', () => {
    const { ativas, bboxDaColecao, bboxLido, centralizador, repeticoes, tique } = montar({
      pronto: false,
    });
    centralizador.centralizar(ponto(-40.0, -20.0));
    const [repeticao] = repeticoes;
    const tiques = Math.ceil(10_000 / (repeticao?.intervalo ?? 1));
    for (let i = 0; i < tiques; i++) tique();
    expect(ativas()).toHaveLength(0);
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('um alvo novo durante a insistência a substitui, e o bbox devolvido continua o da coleção', () => {
    const {
      ativas,
      bboxDaColecao,
      bboxLido,
      centralizador,
      estado,
      moverACamera,
      pendentes,
      tique,
    } = montar({
      pronto: false,
    });
    centralizador.centralizar(ponto(-40.0, -20.0));
    centralizador.centralizar(ponto(-39.0, -19.5));
    expect(ativas()).toHaveLength(1);
    tique();
    const [oeste, , leste] = estado.geojsonBounds as Retangulo;
    expect((oeste + leste) / 2).toBeCloseTo(-39.0, 6);
    moverACamera([-39.5, -20, -38.5, -19]);
    for (const tarefa of pendentes) tarefa();
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('depois de a câmera mudar uma vez, o mapa está pronto: um bounds só, sem insistir', () => {
    const { ativas, centralizador, moverACamera } = montar({ pronto: false });
    moverACamera(VISIVEL);
    centralizador.centralizar(ponto(-40.0, -20.0));
    expect(ativas()).toHaveLength(0);
  });
});
