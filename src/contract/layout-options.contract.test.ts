import { describe, expect, it } from 'vitest';
import {
  COLUMN_KEYS,
  configuredColumns,
  normalizeLayoutOptions,
} from './layout-options.contract.js';

describe('normalizeLayoutOptions — o preset vem do banco, não de um objeto já tipado', () => {
  it('converte números que voltaram como texto, que é como a interface grava um v-input', () => {
    const options = normalizeLayoutOptions({
      mapCenterLng: '-47.9292',
      mapCenterLat: '-15.7801',
      mapZoom: '8',
    });

    expect(options.mapCenterLng).toBe(-47.9292);
    expect(options.mapCenterLat).toBe(-15.7801);
    expect(options.mapZoom).toBe(8);
  });

  it('descarta números impossíveis em vez de deixar NaN chegar ao mapa', () => {
    const options = normalizeLayoutOptions({ mapCenterLng: 'abc', mapZoom: Number.NaN });

    expect(options.mapCenterLng).toBeUndefined();
    expect(options.mapZoom).toBeUndefined();
  });

  it('trata texto em branco como campo não preenchido, para o padrão detectado valer', () => {
    const options = normalizeLayoutOptions({ title: '   ', geolocation: '', coluna1: '  ' });

    expect(options.title).toBeUndefined();
    expect(options.geolocation).toBeUndefined();
    expect(options.coluna1).toBeUndefined();
  });

  it('apara espaços em volta do nome do campo, que quebrariam a busca na coleção', () => {
    expect(normalizeLayoutOptions({ geolocation: ' position ' }).geolocation).toBe('position');
  });

  it('só aceita booleano de verdade em zoomOnClick, sem tratar "false" como verdadeiro', () => {
    expect(normalizeLayoutOptions({ zoomOnClick: true }).zoomOnClick).toBe(true);
    expect(normalizeLayoutOptions({ zoomOnClick: 'false' }).zoomOnClick).toBeUndefined();
  });

  it('não lança para um preset ausente ou de outro formato, porque layoutOptions começa vazio', () => {
    expect(normalizeLayoutOptions(undefined)).toBeDefined();
    expect(normalizeLayoutOptions(null)).toBeDefined();
    expect(normalizeLayoutOptions('texto')).toBeDefined();
  });

  it('ignora chaves que o layout não conhece, vindas de um preset antigo', () => {
    const options = normalizeLayoutOptions({ geolocation: 'position', widthMap: { a: 1 } });

    expect(options).not.toHaveProperty('widthMap');
    expect(options.geolocation).toBe('position');
  });
});

describe('configuredColumns — o usuário pode deixar buracos entre as colunas', () => {
  it('devolve as colunas na ordem em que foram declaradas', () => {
    const columns = configuredColumns({ coluna1: 'nome', coluna2: 'status', coluna3: 'cidade' });

    expect(columns).toEqual(['nome', 'status', 'cidade']);
  });

  it('fecha os buracos, para a grade não abrir uma coluna sem cabeçalho', () => {
    const columns = configuredColumns({ coluna1: 'nome', coluna3: 'cidade', coluna5: 'uf' });

    expect(columns).toEqual(['nome', 'cidade', 'uf']);
  });

  it('devolve lista vazia quando nada foi configurado', () => {
    expect(configuredColumns({})).toEqual([]);
  });
});

describe('COLUMN_KEYS — os nomes numerados vêm do formato do preset do Directus', () => {
  it('cobre as cinco colunas que o preset guarda', () => {
    expect(COLUMN_KEYS).toEqual(['coluna1', 'coluna2', 'coluna3', 'coluna4', 'coluna5']);
  });
});
