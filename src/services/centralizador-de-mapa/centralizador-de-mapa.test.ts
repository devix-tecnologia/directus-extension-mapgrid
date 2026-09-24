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

function montar(visivel: Retangulo | null = VISIVEL) {
  const bboxDaColecao: Retangulo = [-41, -21, -39, -19];
  const estado: Record<string, unknown> = {
    cameraOptions: visivel ? { bbox: [...visivel], zoom: 12 } : undefined,
    geojson: { bbox: [...bboxDaColecao], features: [], type: 'FeatureCollection' },
    geojsonBounds: undefined,
  };
  const pendentes: (() => void)[] = [];
  const centralizador = new CentralizadorDoMapaDirectus(
    estado,
    () => TELA,
    (tarefa) => pendentes.push(tarefa)
  );
  const bboxLido = () => (estado.geojson as { bbox: Retangulo }).bbox;
  return { bboxDaColecao, bboxLido, centralizador, estado, pendentes };
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

  it('sem área visível conhecida, o ponto é enquadrado pelo próprio retângulo', () => {
    // antes do primeiro moveend não há cameraOptions.bbox para manter o zoom;
    // o fitBounds deles aplica o maxZoom 14
    const { bboxLido, centralizador } = montar(null);
    expect(centralizador.centralizar(ponto(-40.0, -20.0))).toBe(true);
    expect(bboxLido()).toEqual([-40.0, -20.0, -40.0, -20.0]);
  });
});
