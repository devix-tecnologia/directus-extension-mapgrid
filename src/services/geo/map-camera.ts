import type { MapCameraOptions, PointCoordinates } from '../../contract/index';

/** Brasília. Centro de partida quando o preset não define um. */
export const DEFAULT_MAP_CENTER: PointCoordinates = [-47.9292, -15.7801];
export const DEFAULT_MAP_ZOOM = 4;

const DEGREES_IN_A_TURN = 360;
const HALF_TURN = 180;

export interface LngLatBoundsLike {
  getWest: () => number;
  getEast: () => number;
  getSouth: () => number;
  getNorth: () => number;
}

/**
 * O centro do preset, ou o padrão. Longitude e latitude só valem juntas: meio
 * par posicionaria o mapa num lugar que o usuário não escolheu, então a metade
 * preenchida é descartada.
 */
export const resolveMapCenter = (options: MapCameraOptions): PointCoordinates =>
  options.mapCenterLng != null && options.mapCenterLat != null
    ? [options.mapCenterLng, options.mapCenterLat]
    : [...DEFAULT_MAP_CENTER];

/** O zoom do preset, ou o padrão. */
export const resolveMapZoom = (options: MapCameraOptions): number =>
  options.mapZoom ?? DEFAULT_MAP_ZOOM;

/**
 * A mesma longitude, deslocada em voltas inteiras até cair perto da referência.
 *
 * O mapa rola infinitamente no eixo leste-oeste, então o ponto em -179° e o
 * clique em +179° estão a dois graus de distância na tela e a 358° na conta.
 * Sem isso o popup abre numa cópia do mundo que não está à vista.
 */
export const longitudeNearest = (longitude: number, reference: number): number => {
  let adjusted = longitude;
  while (Math.abs(reference - adjusted) > HALF_TURN) {
    adjusted += reference > adjusted ? DEGREES_IN_A_TURN : -DEGREES_IN_A_TURN;
  }
  return adjusted;
};

/** O mesmo ponto, com a longitude trazida para perto da referência. */
export const coordinatesNearest = (
  coordinates: PointCoordinates,
  referenceLongitude: number
): PointCoordinates => [longitudeNearest(coordinates[0], referenceLongitude), coordinates[1]];

/**
 * Se o ponto está fora do que se vê. Serve para decidir entre deslocar o mapa e
 * deixá-lo parado: mover a câmera para um ponto que já está à vista só faz o
 * mapa tremer sem motivo.
 */
export const isOutsideBounds = (
  coordinates: PointCoordinates,
  bounds: LngLatBoundsLike
): boolean => {
  const [longitude, latitude] = coordinates;
  return (
    longitude < bounds.getWest() ||
    longitude > bounds.getEast() ||
    latitude < bounds.getSouth() ||
    latitude > bounds.getNorth()
  );
};
