import { describe, expect, it, vi } from 'vitest';
import { CentralizadorDoMapaDirectus } from './centralizador-de-mapa';
import type { Retangulo } from './centralizador-de-mapa.types';

const VISIVEL: Retangulo = [-40.4, -20.4, -40.2, -20.2];
const TELA = { largura: 1000, altura: 600 };

interface OpcoesDeMontagem {
  itens?: Record<string, unknown>[];
  pronto?: boolean;
  visivel?: Retangulo | null;
  camera?: Record<string, unknown>;
  buscarItens?: (
    chaves: readonly unknown[],
    campos: readonly string[]
  ) => Promise<Record<string, unknown>[]>;
}

function montar({
  buscarItens = async () => [],
  camera,
  itens = [],
  pronto = true,
  visivel = VISIVEL,
}: OpcoesDeMontagem = {}) {
  const bboxDaColecao: Retangulo = [-41, -21, -39, -19];
  const estado: Record<string, unknown> = {
    cameraOptions: camera ?? (visivel ? { bbox: [...visivel], zoom: 12 } : undefined),
    geojson: { bbox: [...bboxDaColecao], features: [], type: 'FeatureCollection' },
    geojsonBounds: undefined,
    fitDataBounds: vi.fn(),
  };
  const pendentes: (() => void)[] = [];
  const repeticoes: { cancelada: boolean; intervalo: number; tarefa: () => void }[] = [];
  const centralizador = new CentralizadorDoMapaDirectus(
    estado,
    () => TELA,
    {
      depoisDaAtualizacao: (tarefa) => pendentes.push(tarefa),
      repetir: (tarefa, intervalo) => {
        const repeticao = { cancelada: false, intervalo, tarefa };
        repeticoes.push(repeticao);
        return () => {
          repeticao.cancelada = true;
        };
      },
    },
    { buscarItens, itensDaGrade: () => itens }
  );
  if (pronto) centralizador.aoMoverACamera();
  const bboxLido = () => (estado.geojson as { bbox: Retangulo }).bbox;
  const tique = () => {
    for (const repeticao of repeticoes) if (!repeticao.cancelada) repeticao.tarefa();
  };
  const ativas = () => repeticoes.filter((repeticao) => !repeticao.cancelada);
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
    const { bboxLido, centralizador } = montar({ visivel: null });
    expect(centralizador.centralizar(ponto(-40.0, -20.0))).toBe(true);
    expect(bboxLido()).toEqual([-40.0, -20.0, -40.0, -20.0]);
  });
});

describe('antes de o mapa do Directus terminar de carregar', () => {
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

describe('enquadrar tudo', () => {
  it('pede ao Directus o enquadramento da coleção', () => {
    const { centralizador, estado } = montar();
    centralizador.enquadrarTudo();
    expect(estado.fitDataBounds).toHaveBeenCalledOnce();
  });

  it('com uma insistência pendente, devolve o bbox da coleção antes — o fitDataBounds deles lê esse bbox', () => {
    const { ativas, bboxDaColecao, bboxLido, centralizador, estado } = montar({ pronto: false });
    centralizador.centralizar(ponto(-40.0, -20.0));
    let bboxQuandoChamado: unknown;
    (estado.fitDataBounds as ReturnType<typeof vi.fn>).mockImplementation(() => {
      bboxQuandoChamado = [...bboxLido()];
    });

    centralizador.enquadrarTudo();

    expect(bboxQuandoChamado).toEqual(bboxDaColecao);
    expect(ativas()).toHaveLength(0);
  });

  it('sem fitDataBounds no estado, não faz nada e não quebra', () => {
    const { centralizador, estado } = montar();
    delete estado.fitDataBounds;
    expect(() => centralizador.enquadrarTudo()).not.toThrow();
  });
});

describe('centralizar um item pela feature que o Directus montou', () => {
  const trajeto = {
    coordinates: [
      [-40.1, -20.1],
      [-39.7, -19.8],
    ],
    type: 'LineString',
  };

  function comFeatures(features: unknown[]) {
    const montagem = montar();
    montagem.estado.featureId = 'codigo';
    (montagem.estado.geojson as { features: unknown[] }).features = features;
    return montagem;
  }

  it('enquadra pela geometria da feature, e não pelo campo cru — que pode ser csv, lnglat ou wkt', () => {
    const { bboxLido, centralizador } = comFeatures([
      { geometry: trajeto, properties: { codigo: 7 }, type: 'Feature' },
    ]);

    expect(centralizador.centralizarItem({ codigo: 7, local: '-40.1,-20.1' })).toBe(true);
    expect(bboxLido()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });

  it('acha a feature pela chave primária que o layout declara, seja qual for o nome', () => {
    const { bboxLido, centralizador } = comFeatures([
      {
        geometry: { coordinates: [-39, -19], type: 'Point' },
        properties: { codigo: 1 },
        type: 'Feature',
      },
      { geometry: trajeto, properties: { codigo: 2 }, type: 'Feature' },
    ]);

    centralizador.centralizarItem({ codigo: 2 }, { somenteSeFora: false });

    expect(bboxLido()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });

  it('item sem feature — sem geometria, ou fora da página — não mexe na câmera', () => {
    const { bboxDaColecao, bboxLido, centralizador, estado } = comFeatures([
      { geometry: trajeto, properties: { codigo: 2 }, type: 'Feature' },
    ]);

    expect(centralizador.centralizarItem({ codigo: 9 })).toBe(false);
    expect(estado.geojsonBounds).toBeUndefined();
    expect(bboxLido()).toEqual(bboxDaColecao);
  });

  it('sem featureId no estado, não adivinha a chave', () => {
    const { centralizador, estado } = comFeatures([
      { geometry: trajeto, properties: { codigo: 2 }, type: 'Feature' },
    ]);
    delete estado.featureId;

    expect(centralizador.centralizarItem({ codigo: 2 })).toBe(false);
  });
});

describe('geometria nativa: o mapa do Directus só tem o que está na tela', () => {
  const RIO_SP = {
    coordinates: [
      [-43.17, -22.9],
      [-46.63, -23.55],
    ],
    type: 'LineString',
  };
  const MANAUS_BELEM = {
    coordinates: [
      [-60.02, -3.11],
      [-48.5, -1.45],
    ],
    type: 'LineString',
  };
  const itens = [
    { id: 1, trajeto: RIO_SP },
    { id: 2, trajeto: MANAUS_BELEM },
  ];

  function nativo() {
    const montagem = montar({ itens });
    Object.assign(montagem.estado, {
      featureId: 'id',
      geometryField: 'trajeto',
      isGeometryFieldNative: true,
    });
    // o layout só buscou o que cai na área visível: Rio–SP
    (montagem.estado.geojson as { features: unknown[] }).features = [
      { geometry: RIO_SP, properties: { id: 1 }, type: 'Feature' },
    ];
    return montagem;
  }

  it('reenquadrar enquadra os itens da grade, e não só o que o mapa buscou', () => {
    const { bboxLido, centralizador, estado } = nativo();

    centralizador.enquadrarTudo();

    expect(bboxLido()).toEqual([-60.02, -23.55, -43.17, -1.45]);
    expect(estado.fitDataBounds).not.toHaveBeenCalled();
  });

  it('o item fora da tela não tem feature, mas a geometria nativa já vem em GeoJSON no próprio item', () => {
    const { bboxLido, centralizador } = nativo();

    expect(centralizador.centralizarItem(itens[1] as Record<string, unknown>)).toBe(true);
    expect(bboxLido()).toEqual([-60.02, -3.11, -48.5, -1.45]);
  });

  it('sem geometria nativa, o item sem feature continua sem mexer na câmera — o campo cru pode ser csv', () => {
    const { centralizador, estado } = nativo();
    estado.isGeometryFieldNative = false;

    expect(centralizador.centralizarItem({ id: 2, trajeto: '-60.02,-3.11' })).toBe(false);
  });

  it('sem geometria nativa, reenquadrar segue sendo o fitDataBounds do Directus', () => {
    const { centralizador, estado } = nativo();
    estado.isGeometryFieldNative = false;

    centralizador.enquadrarTudo();

    expect(estado.fitDataBounds).toHaveBeenCalledOnce();
  });
});

describe('geometria nativa que a grade não trouxe — a coluna não está à vista', () => {
  const RIO_SP = {
    coordinates: [
      [-43.17, -22.9],
      [-46.63, -23.55],
    ],
    type: 'LineString',
  };
  const MANAUS_BELEM = {
    coordinates: [
      [-60.02, -3.11],
      [-48.5, -1.45],
    ],
    type: 'LineString',
  };
  const esperarBusca = () => new Promise((resolver) => setTimeout(resolver, 0));

  function semGeometriaNaGrade(buscarItens: OpcoesDeMontagem['buscarItens']) {
    const montagem = montar({ buscarItens, itens: [{ id: 1 }, { id: 2 }] });
    Object.assign(montagem.estado, {
      featureId: 'id',
      geometryField: 'trajeto',
      isGeometryFieldNative: true,
    });
    return montagem;
  }

  it('reenquadrar busca a geometria dos itens da página pela chave, e enquadra todos', async () => {
    const buscarItens = vi.fn(async () => [
      { id: 1, trajeto: RIO_SP },
      { id: 2, trajeto: MANAUS_BELEM },
    ]);
    const { bboxLido, centralizador } = semGeometriaNaGrade(buscarItens);

    centralizador.enquadrarTudo();
    await esperarBusca();

    expect(buscarItens).toHaveBeenCalledWith([1, 2], ['id', 'trajeto']);
    expect(bboxLido()).toEqual([-60.02, -23.55, -43.17, -1.45]);
  });

  it('o clique numa linha fora da tela busca a geometria daquele item e vai até ele', async () => {
    const buscarItens = vi.fn(async () => [{ id: 2, trajeto: MANAUS_BELEM }]);
    const { bboxLido, centralizador } = semGeometriaNaGrade(buscarItens);

    expect(centralizador.centralizarItem({ id: 2 })).toBe(true);
    await esperarBusca();

    expect(buscarItens).toHaveBeenCalledWith([2], ['id', 'trajeto']);
    expect(bboxLido()).toEqual([-60.02, -3.11, -48.5, -1.45]);
  });

  it('a resposta de um clique antigo não vence a de um clique novo', async () => {
    const respostas: Array<(itens: Record<string, unknown>[]) => void> = [];
    const buscarItens = () =>
      new Promise<Record<string, unknown>[]>((resolver) => respostas.push(resolver));
    const { bboxLido, centralizador } = semGeometriaNaGrade(buscarItens);

    centralizador.centralizarItem({ id: 1 });
    centralizador.centralizarItem({ id: 2 });
    respostas[1]?.([{ id: 2, trajeto: MANAUS_BELEM }]);
    await esperarBusca();
    respostas[0]?.([{ id: 1, trajeto: RIO_SP }]);
    await esperarBusca();

    expect(bboxLido()).toEqual([-60.02, -3.11, -48.5, -1.45]);
  });

  it('se a busca falha, reenquadrar cai no fitDataBounds do Directus', async () => {
    const { centralizador, estado } = semGeometriaNaGrade(async () => {
      throw new Error('rede');
    });

    centralizador.enquadrarTudo();
    await esperarBusca();

    expect(estado.fitDataBounds).toHaveBeenCalledOnce();
  });
});
