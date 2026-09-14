/**
 * The boundary with maplibre. Features returned by `querySourceFeatures` and
 * `queryRenderedFeatures` carry `properties: { [name: string]: any }`, because
 * what is in there depends on the source and on clustering — maplibre has no
 * way to know. This module converts that `any` into the shapes the component
 * uses, instead of asserting them with `as` and finding the error deep inside
 * the library.
 */
import { isRecord, type PointCoordinates, parsePointCoordinates } from '../../contract/index';

/** A feature as maplibre returns it: opaque geometry and properties. */
export interface QueriedFeature {
  geometry: unknown;
  properties?: Record<string, unknown> | null;
}

/** The properties `buildPointFeatureCollection` writes on each point. */
export interface MarkerProperties {
  id: string | number;
  formattedTitle: string;
}

/** The properties maplibre's clustering adds to a cluster. */
export interface ClusterProperties {
  clusterId: number;
  pointCount: number;
}

/** A positioned point, with what the component needs to draw it. */
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
 * A marker's id and label. `null` when either is missing: a popup with no text,
 * or a `select-item` with an undefined id, is worse than ignoring the click,
 * because it would highlight the wrong grid row.
 */
export const parseMarkerProperties = (raw: unknown): MarkerProperties | null => {
  if (!isRecord(raw)) return null;

  const { id, formattedTitle } = raw;
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  if (typeof formattedTitle !== 'string') return null;

  return { id, formattedTitle };
};

/**
 * The cluster id and how many items it gathers. The id is what
 * `getClusterExpansionZoom` takes; without it the promise rejects and clicking
 * the cluster does nothing.
 */
export const parseClusterProperties = (raw: unknown): ClusterProperties | null => {
  if (!isRecord(raw)) return null;

  const clusterId = raw.cluster_id;
  const pointCount = raw.point_count;
  if (!isFiniteNumber(clusterId) || !isFiniteNumber(pointCount)) return null;

  return { clusterId, pointCount };
};

/** A complete marker, or `null` when the feature lacks anything it requires. */
export const parseMarkerFeature = (feature: QueriedFeature): MarkerFeature | null => {
  const coordinates = parsePointCoordinates(feature.geometry);
  if (!coordinates) return null;

  const properties = parseMarkerProperties(propertiesOf(feature));
  if (!properties) return null;

  return { ...properties, coordinates };
};

/** A complete cluster, or `null`. */
export const parseClusterFeature = (feature: QueriedFeature): ClusterFeature | null => {
  const coordinates = parsePointCoordinates(feature.geometry);
  if (!coordinates) return null;

  const properties = parseClusterProperties(propertiesOf(feature));
  if (!properties) return null;

  return { ...properties, coordinates };
};

/** The clusters of a feature list, parsed, in order. */
export const parseClusterFeatures = (features: QueriedFeature[]): ClusterFeature[] =>
  features.flatMap((feature) => {
    const cluster = parseClusterFeature(feature);
    return cluster ? [cluster] : [];
  });
