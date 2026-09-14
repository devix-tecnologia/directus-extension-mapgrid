import { describe, expect, it } from 'vitest';
import {
  parseClusterFeature,
  parseClusterFeatures,
  parseClusterProperties,
  parseMarkerFeature,
  parseMarkerProperties,
} from './map-feature.js';

const point = (coordinates: [number, number]) => ({ type: 'Point', coordinates });

describe('parseMarkerProperties — o maplibre devolve properties como any', () => {
  it('lê o id e o rótulo que buildPointFeatureCollection gravou', () => {
    expect(parseMarkerProperties({ id: 7, formattedTitle: 'Brasília' })).toEqual({
      id: 7,
      formattedTitle: 'Brasília',
    });
  });

  it('aceita id em texto, porque a chave primária da coleção pode ser uuid', () => {
    expect(parseMarkerProperties({ id: 'abc-123', formattedTitle: 'X' })?.id).toBe('abc-123');
  });

  it('recusa rótulo ausente, porque um popup sem texto é pior que clique ignorado', () => {
    expect(parseMarkerProperties({ id: 1 })).toBeNull();
    expect(parseMarkerProperties({ id: 1, formattedTitle: 42 })).toBeNull();
  });

  it('recusa id ausente, que destacaria a linha errada da grade', () => {
    expect(parseMarkerProperties({ formattedTitle: 'X' })).toBeNull();
    expect(parseMarkerProperties({ id: null, formattedTitle: 'X' })).toBeNull();
  });

  it('recusa o que não é objeto, sem lançar', () => {
    expect(parseMarkerProperties(null)).toBeNull();
    expect(parseMarkerProperties(undefined)).toBeNull();
    expect(parseMarkerProperties('texto')).toBeNull();
  });
});

describe('parseClusterProperties — o agrupamento é do maplibre, não nosso', () => {
  it('lê o id do cluster e quantos itens ele reúne', () => {
    expect(parseClusterProperties({ cluster_id: 12, point_count: 5 })).toEqual({
      clusterId: 12,
      pointCount: 5,
    });
  });

  it('recusa cluster_id ausente, que faria getClusterExpansionZoom rejeitar', () => {
    expect(parseClusterProperties({ point_count: 5 })).toBeNull();
    expect(parseClusterProperties({ cluster_id: 'doze', point_count: 5 })).toBeNull();
  });

  it('recusa point_count ausente, que viraria um rótulo "undefined" no marcador', () => {
    expect(parseClusterProperties({ cluster_id: 12 })).toBeNull();
  });
});

describe('parseMarkerFeature — geometria e propriedades juntas', () => {
  it('devolve o marcador completo', () => {
    const marker = parseMarkerFeature({
      geometry: point([-47.9, -15.7]),
      properties: { id: 1, formattedTitle: 'Brasília' },
    });

    expect(marker).toEqual({ id: 1, formattedTitle: 'Brasília', coordinates: [-47.9, -15.7] });
  });

  it('devolve null quando a geometria não é um ponto, sem olhar as propriedades', () => {
    expect(
      parseMarkerFeature({
        geometry: { type: 'LineString', coordinates: [[0, 0]] },
        properties: { id: 1, formattedTitle: 'X' },
      })
    ).toBeNull();
  });

  it('devolve null quando a feature vem sem propriedades', () => {
    expect(parseMarkerFeature({ geometry: point([0, 0]), properties: null })).toBeNull();
    expect(parseMarkerFeature({ geometry: point([0, 0]) })).toBeNull();
  });
});

describe('parseClusterFeature', () => {
  it('devolve o cluster completo', () => {
    expect(
      parseClusterFeature({
        geometry: point([-46.6, -23.5]),
        properties: { cluster_id: 3, point_count: 12 },
      })
    ).toEqual({ clusterId: 3, pointCount: 12, coordinates: [-46.6, -23.5] });
  });
});

describe('parseClusterFeatures — a lista devolvida por querySourceFeatures', () => {
  it('preserva a ordem dos clusters válidos', () => {
    const clusters = parseClusterFeatures([
      { geometry: point([1, 1]), properties: { cluster_id: 1, point_count: 2 } },
      { geometry: point([2, 2]), properties: { cluster_id: 2, point_count: 3 } },
    ]);

    expect(clusters.map((cluster) => cluster.clusterId)).toEqual([1, 2]);
  });

  it('descarta o que não parseia em vez de interromper o desenho dos demais', () => {
    const clusters = parseClusterFeatures([
      { geometry: point([1, 1]), properties: { cluster_id: 1, point_count: 2 } },
      { geometry: point([2, 2]), properties: { point_count: 3 } },
      { geometry: null, properties: { cluster_id: 3, point_count: 4 } },
      { geometry: point([4, 4]), properties: { cluster_id: 4, point_count: 5 } },
    ]);

    expect(clusters.map((cluster) => cluster.clusterId)).toEqual([1, 4]);
  });

  it('devolve lista vazia quando nada agrupa', () => {
    expect(parseClusterFeatures([])).toEqual([]);
  });
});
