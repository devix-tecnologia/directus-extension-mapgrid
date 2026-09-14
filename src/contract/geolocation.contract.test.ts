import { describe, expect, it } from 'vitest';
import { itemPointCoordinates, parsePointCoordinates } from './geolocation.contract.js';

describe('parsePointCoordinates — o campo é JSON na coleção, então nada garante que seja um ponto', () => {
  it('lê um ponto do Directus na ordem [longitude, latitude]', () => {
    expect(parsePointCoordinates({ type: 'Point', coordinates: [-47.9292, -15.7801] })).toEqual([
      -47.9292, -15.7801,
    ]);
  });

  it('aceita coordenadas sem o campo type, que é como alguns presets antigos gravaram', () => {
    expect(parsePointCoordinates({ coordinates: [10, 20] })).toEqual([10, 20]);
  });

  it('recusa geometrias que não são ponto em vez de ler o primeiro par de um polígono', () => {
    expect(
      parsePointCoordinates({
        type: 'Polygon',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      })
    ).toBeNull();
  });

  it('recusa NaN e Infinity, que chegariam ao maplibre como "Invalid LngLat object" longe da causa', () => {
    expect(parsePointCoordinates({ coordinates: [Number.NaN, 10] })).toBeNull();
    expect(parsePointCoordinates({ coordinates: [10, Number.POSITIVE_INFINITY] })).toBeNull();
  });

  it('recusa coordenadas em texto, porque um ponto meio convertido desenha no lugar errado', () => {
    expect(parsePointCoordinates({ coordinates: ['-47.9', '-15.7'] })).toBeNull();
  });

  it('recusa pares incompletos ou com dimensão a mais', () => {
    expect(parsePointCoordinates({ coordinates: [10] })).toBeNull();
    expect(parsePointCoordinates({ coordinates: [10, 20, 30] })).toBeNull();
  });

  it('trata ausência de valor como ausência de ponto, sem lançar', () => {
    expect(parsePointCoordinates(null)).toBeNull();
    expect(parsePointCoordinates(undefined)).toBeNull();
    expect(parsePointCoordinates('POINT(-47.9 -15.7)')).toBeNull();
    expect(parsePointCoordinates({})).toBeNull();
  });
});

describe('itemPointCoordinates — o campo de geolocalização é escolhido nas opções do layout', () => {
  const item = {
    id: 1,
    position: { type: 'Point', coordinates: [-46.6333, -23.5505] },
    outro: 'texto',
  };

  it('lê o campo pedido', () => {
    expect(itemPointCoordinates(item, 'position')).toEqual([-46.6333, -23.5505]);
  });

  it('devolve null quando o campo configurado não existe no item, para o item ser pulado', () => {
    expect(itemPointCoordinates(item, 'inexistente')).toBeNull();
    expect(itemPointCoordinates(item, 'outro')).toBeNull();
  });
});
