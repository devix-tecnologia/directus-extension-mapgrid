/**
 * A fronteira com o maplibre. As features que voltam de `querySourceFeatures` e
 * `queryRenderedFeatures` têm `properties: { [name: string]: any }`, porque o
 * que há ali depende da fonte e do agrupamento — o maplibre não tem como saber.
 * Este módulo converte esse `any` nas formas que o componente usa, em vez de
 * afirmá-las com `as` e descobrir o erro lá dentro da biblioteca.
 */
import { isRecord, type PointCoordinates, parsePointCoordinates } from '../../contract/index.js';

/** Uma feature como o maplibre a devolve: geometria e propriedades opacas. */
export interface QueriedFeature {
  geometry: unknown;
  properties?: Record<string, unknown> | null;
}

/** As propriedades que `buildPointFeatureCollection` grava em cada ponto. */
export interface MarkerProperties {
  id: string | number;
  formattedTitle: string;
}

/** As propriedades que o agrupamento do maplibre acrescenta a um cluster. */
export interface ClusterProperties {
  clusterId: number;
  pointCount: number;
}

/** Um ponto já posicionado, com o que o componente precisa para desenhá-lo. */
export interface MarkerFeature extends MarkerProperties {
  coordinates: PointCoordinates;
}

export interface ClusterFeature extends ClusterProperties {
  coordinates: PointCoordinates;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const propertiesOf = (feature: QueriedFeature): Record<string, unknown> =>
  isRecord(feature.properties) ? feature.properties : {};

/**
 * O id e o rótulo de um marcador. `null` quando falta qualquer um dos dois: um
 * popup sem texto ou um `select-item` com id indefinido são piores que ignorar
 * o clique, porque destacariam a linha errada da grade.
 */
export const parseMarkerProperties = (raw: unknown): MarkerProperties | null => {
  if (!isRecord(raw)) return null;

  const { id, formattedTitle } = raw;
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  if (typeof formattedTitle !== 'string') return null;

  return { id, formattedTitle };
};

/**
 * O id do cluster e quantos itens ele reúne. O id é o que `getClusterExpansionZoom`
 * recebe; sem ele a promessa rejeita e o clique no grupo não faz nada.
 */
export const parseClusterProperties = (raw: unknown): ClusterProperties | null => {
  if (!isRecord(raw)) return null;

  const clusterId = raw.cluster_id;
  const pointCount = raw.point_count;
  if (!isFiniteNumber(clusterId) || !isFiniteNumber(pointCount)) return null;

  return { clusterId, pointCount };
};

/** Um marcador completo, ou `null` se a feature não trouxer tudo o que ele exige. */
export const parseMarkerFeature = (feature: QueriedFeature): MarkerFeature | null => {
  const coordinates = parsePointCoordinates(feature.geometry);
  if (!coordinates) return null;

  const properties = parseMarkerProperties(propertiesOf(feature));
  if (!properties) return null;

  return { ...properties, coordinates };
};

/** Um cluster completo, ou `null`. */
export const parseClusterFeature = (feature: QueriedFeature): ClusterFeature | null => {
  const coordinates = parsePointCoordinates(feature.geometry);
  if (!coordinates) return null;

  const properties = parseClusterProperties(propertiesOf(feature));
  if (!properties) return null;

  return { ...properties, coordinates };
};

/** Os clusters de uma lista de features, já parseados, na ordem. */
export const parseClusterFeatures = (features: QueriedFeature[]): ClusterFeature[] =>
  features.flatMap((feature) => {
    const cluster = parseClusterFeature(feature);
    return cluster ? [cluster] : [];
  });
