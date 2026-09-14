/**
 * A forma do campo de geolocalização de um item, como ele chega da API do
 * Directus. O valor é opaco: o campo é declarado como JSON na coleção, então
 * nada garante que o que voltou seja um ponto — pode ser um polígono, um valor
 * meio preenchido, ou `null`. Quem lê precisa parsear, não asseverar.
 */

import { isRecord } from './is-record.js';

/** Longitude e latitude, na ordem que o GeoJSON e o maplibre usam. */
export type PointCoordinates = [number, number];

export interface RowItem {
  id: string | number;
  [key: string]: unknown;
}

export type GeoItem = RowItem;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * As coordenadas de um ponto, ou `null` para qualquer outra coisa. Rejeita
 * geometrias que não são ponto e coordenadas incompletas ou não numéricas —
 * um `NaN` que passasse daqui viraria um "Invalid LngLat object" lá dentro do
 * maplibre, longe da causa.
 */
export const parsePointCoordinates = (raw: unknown): PointCoordinates | null => {
  if (!isRecord(raw)) return null;
  if (raw.type !== undefined && raw.type !== 'Point') return null;

  const coordinates = raw.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;

  const [longitude, latitude] = coordinates;
  if (!isFiniteNumber(longitude) || !isFiniteNumber(latitude)) return null;

  return [longitude, latitude];
};

/** O ponto guardado em `field`, ou `null` se o item não tiver um ponto ali. */
export const itemPointCoordinates = (item: GeoItem, field: string): PointCoordinates | null =>
  parsePointCoordinates(item[field]);
