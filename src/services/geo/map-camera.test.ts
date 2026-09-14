import { describe, expect, it } from 'vitest';
import {
  coordinatesNearest,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  isOutsideBounds,
  longitudeNearest,
  resolveMapCenter,
  resolveMapZoom,
} from './map-camera.js';

describe('resolveMapCenter — o centro só é válido com as duas coordenadas', () => {
  it('usa o centro do preset quando as duas estão preenchidas', () => {
    expect(resolveMapCenter({ mapCenterLng: 10, mapCenterLat: 20 })).toEqual([10, 20]);
  });

  it('cai no padrão com meio par, para não posicionar num lugar que ninguém escolheu', () => {
    expect(resolveMapCenter({ mapCenterLng: 10 })).toEqual(DEFAULT_MAP_CENTER);
    expect(resolveMapCenter({ mapCenterLat: 20 })).toEqual(DEFAULT_MAP_CENTER);
    expect(resolveMapCenter({})).toEqual(DEFAULT_MAP_CENTER);
  });

  it('aceita o zero, que é uma coordenada legítima e não ausência de valor', () => {
    expect(resolveMapCenter({ mapCenterLng: 0, mapCenterLat: 0 })).toEqual([0, 0]);
  });

  it('devolve uma cópia, para quem mover a câmera não alterar o padrão do módulo', () => {
    const center = resolveMapCenter({});
    center[0] = 999;

    expect(DEFAULT_MAP_CENTER[0]).toBe(-47.9292);
  });
});

describe('resolveMapZoom', () => {
  it('usa o zoom do preset, inclusive o zero', () => {
    expect(resolveMapZoom({ mapZoom: 12 })).toBe(12);
    expect(resolveMapZoom({ mapZoom: 0 })).toBe(0);
  });

  it('cai no padrão quando o preset não define', () => {
    expect(resolveMapZoom({})).toBe(DEFAULT_MAP_ZOOM);
  });
});

describe('longitudeNearest — o mapa rola sem fim no eixo leste-oeste', () => {
  it('não mexe no que já está perto', () => {
    expect(longitudeNearest(-47.9, -46)).toBe(-47.9);
  });

  it('traz o ponto para a volta que está à vista, em vez de abrir numa cópia do mundo', () => {
    // clique em +179 e ponto em -179: dois graus na tela, 358 na conta
    expect(longitudeNearest(-179, 179)).toBe(181);
    expect(longitudeNearest(179, -179)).toBe(-181);
  });

  it('atravessa quantas voltas forem precisas', () => {
    expect(longitudeNearest(0, 720)).toBe(720);
  });

  it('deixa a diferença de exatamente 180 como está, porque não há volta mais próxima', () => {
    expect(longitudeNearest(0, 180)).toBe(0);
  });
});

describe('coordinatesNearest', () => {
  it('ajusta só a longitude e preserva a latitude', () => {
    expect(coordinatesNearest([-179, -15.78], 179)).toEqual([181, -15.78]);
  });
});

describe('isOutsideBounds — mover a câmera para o que já se vê só faz o mapa tremer', () => {
  const bounds = {
    getWest: () => -50,
    getEast: () => -40,
    getSouth: () => -20,
    getNorth: () => -10,
  };

  it('diz que não, para um ponto dentro do que se vê', () => {
    expect(isOutsideBounds([-45, -15], bounds)).toBe(false);
  });

  it('diz que sim, em cada uma das quatro direções', () => {
    expect(isOutsideBounds([-51, -15], bounds)).toBe(true);
    expect(isOutsideBounds([-39, -15], bounds)).toBe(true);
    expect(isOutsideBounds([-45, -21], bounds)).toBe(true);
    expect(isOutsideBounds([-45, -9], bounds)).toBe(true);
  });

  it('trata a borda exata como dentro, para o ponto na beirada não provocar deslocamento', () => {
    expect(isOutsideBounds([-50, -20], bounds)).toBe(false);
    expect(isOutsideBounds([-40, -10], bounds)).toBe(false);
  });
});
