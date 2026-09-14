import { describe, expect, it } from 'vitest';
import type { GeoItem } from '../../contract/index.js';
import { buildPointFeatureCollection } from './geo.js';

const itemAt = (id: number, coordinates: [number, number], nome: string): GeoItem => ({
  id,
  nome,
  position: { type: 'Point', coordinates },
});

describe('buildPointFeatureCollection — a fonte GeoJSON do mapa', () => {
  it('vira uma feature por item, com o id preservado para casar com a linha da grade', () => {
    const collection = buildPointFeatureCollection({
      items: [itemAt(1, [-47.9, -15.7], 'Brasília'), itemAt(2, [-46.6, -23.5], 'São Paulo')],
      geolocationField: 'position',
      titleTemplate: '{{nome}}',
    });

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.properties).toEqual({ id: 1, formattedTitle: 'Brasília' });
    expect(collection.features[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [-47.9, -15.7],
    });
  });

  it('omite o item sem ponto, porque o agrupamento contaria um marcador inexistente', () => {
    const collection = buildPointFeatureCollection({
      items: [
        itemAt(1, [-47.9, -15.7], 'Brasília'),
        { id: 2, nome: 'Sem local', position: null },
        { id: 3, nome: 'Campo ausente' },
      ],
      geolocationField: 'position',
      titleTemplate: '{{nome}}',
    });

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]?.properties.id).toBe(1);
  });

  it('omite o item cujo ponto não sobrevive ao parse, em vez de propagar NaN ao mapa', () => {
    const collection = buildPointFeatureCollection({
      items: [{ id: 1, nome: 'Torto', position: { coordinates: ['a', 'b'] } }],
      geolocationField: 'position',
      titleTemplate: '{{nome}}',
    });

    expect(collection.features).toEqual([]);
  });

  it('lê o campo de geolocalização que o preset escolheu, não um nome fixo', () => {
    const collection = buildPointFeatureCollection({
      items: [{ id: 1, nome: 'Outro campo', localizacao: { coordinates: [1, 2] } }],
      geolocationField: 'localizacao',
      titleTemplate: '{{nome}}',
    });

    expect(collection.features[0]?.geometry.coordinates).toEqual([1, 2]);
  });

  it('cai no id quando o template não resolve, para o popup nunca abrir vazio', () => {
    const collection = buildPointFeatureCollection({
      items: [itemAt(7, [0, 0], 'Sete')],
      geolocationField: 'position',
      titleTemplate: '{{inexistente}}',
    });

    expect(collection.features[0]?.properties.formattedTitle).toBe('7');
  });

  it('devolve uma coleção vazia para lista vazia, e não um valor ausente', () => {
    const collection = buildPointFeatureCollection({
      items: [],
      geolocationField: 'position',
      titleTemplate: '{{nome}}',
    });

    expect(collection).toEqual({ type: 'FeatureCollection', features: [] });
  });
});
