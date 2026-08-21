<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <v-button v-tooltip="'Reset view'" class="reset-map-btn" icon rounded @click="resetMap">
      <v-icon name="zoom_out_map" />
    </v-button>
  </div>
</template>

<script setup lang="ts">
import maplibregl from 'maplibre-gl';
import { nextTick, onMounted, ref, watchEffect } from 'vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoItem, GeoJsonFeature } from '../../types.js';
import { serializeFieldValue } from '../../utils.js';

const SOURCE_ID = 'points';
const CLUSTER_LAYER_ID = 'clusters';
const UNCLUSTERED_LAYER_ID = 'unclustered-point';
const MARKER_SIZE = 40;
const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_CENTER: [number, number] = [-47.9292, -15.7801];
const DEFAULT_ZOOM = 4;
const FIT_BOUNDS_PADDING = 50;
const FIT_BOUNDS_MAX_ZOOM = 15;
const ANIMATION_DURATION_MS = 1000;
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 20;
const HIGHLIGHT_STROKE_WIDTH = 4;
const DEFAULT_STROKE_WIDTH = 2;
const CURSOR_POINTER = 'pointer';
const CURSOR_RESET = '';
const FLASH_HIGHLIGHT_DURATION_MS = 1000;

const props = defineProps<{
  items: GeoItem[];
  geolocation: string;
  title: string;
  zoomOnClick?: boolean;
  centerLng?: number;
  centerLat?: number;
  initialZoom?: number;
}>();

const emit = defineEmits<{
  'select-item': [id: string | number];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
const map = ref<maplibregl.Map | null>(null);
const popups = ref<maplibregl.Popup[]>([]);
const clusterMarkers = ref<maplibregl.Marker[]>([]);

const getMapOrReturn = (): maplibregl.Map | null => map.value as maplibregl.Map | null;

const resolveThemePrimaryColor = (): string => {
  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue('--theme--primary').trim() || '#007bff';
};

const resolveFieldTemplate = (item: GeoItem, template: string): string => {
  if (!template) return String(item.id);
  let result = template;
  const fieldPattern = /\{\{([^}]+)\}\}/g;
  const matches = result.match(fieldPattern) || [];

  if (matches.length === 0 && template in item) {
    return serializeFieldValue(item[template]);
  }

  for (const match of matches) {
    const fieldName = match.slice(2, -2);
    const raw = item[fieldName];
    const resolved = serializeFieldValue(raw);
    result = result.replace(match, resolved);
  }

  return result.trim() || String(item.id);
};

const resolveItemCoords = (item: GeoItem): [number, number] | undefined => {
  const coords = (item[props.geolocation] as { coordinates?: [number, number] } | undefined)
    ?.coordinates;
  return coords && coords.length === 2 ? [coords[0], coords[1]] : undefined;
};

const buildGeoJson = (): { type: 'FeatureCollection'; features: GeoJsonFeature[] } => {
  const features: GeoJsonFeature[] = [];

  for (const item of props.items) {
    const coords = resolveItemCoords(item);
    if (!coords) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: { id: item.id, formattedTitle: resolveFieldTemplate(item, props.title) },
    });
  }

  return { type: 'FeatureCollection', features };
};

const fitBoundsToItems = (): void => {
  const m = getMapOrReturn();
  if (!m || props.items.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  for (const item of props.items) {
    const coords = resolveItemCoords(item);
    if (coords) {
      bounds.extend(coords);
    }
  }

  if (!bounds.isEmpty()) {
    m.fitBounds(bounds, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: FIT_BOUNDS_MAX_ZOOM,
      duration: ANIMATION_DURATION_MS,
    });
  }
};

const dismissAllPopups = (): void => {
  for (const popup of popups.value) popup.remove();
  popups.value = [];
};

const createClusterLabelElement = (count: number): HTMLDivElement => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(MARKER_SIZE));
  svg.setAttribute('height', String(MARKER_SIZE));

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '50%');
  text.setAttribute('y', '50%');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('fill', '#fff');
  text.setAttribute('font-size', '14');
  text.setAttribute('font-family', 'Arial');
  text.textContent = count.toString();
  svg.appendChild(text);

  const container = document.createElement('div');
  container.appendChild(svg);
  container.style.width = `${MARKER_SIZE}px`;
  container.style.height = `${MARKER_SIZE}px`;
  container.style.pointerEvents = 'none';
  return container;
};

const refreshClusterLabels = (): void => {
  const m = getMapOrReturn();
  if (!m || !m.isStyleLoaded()) return;

  const source = m.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (!source) return;

  source.setData(buildGeoJson());

  for (const marker of clusterMarkers.value) marker.remove();
  clusterMarkers.value = [];

  const clusters = m.querySourceFeatures(SOURCE_ID, { filter: ['has', 'point_count'] });

  for (const cluster of clusters) {
    const count = cluster.properties?.point_count as number;
    const coords = (cluster.geometry as GeoJSON.Point).coordinates as [number, number];

    const marker = new maplibregl.Marker({
      element: createClusterLabelElement(count),
      offset: [0, 0],
    })
      .setLngLat(coords)
      .addTo(m);

    // @ts-expect-error maplibre-gl Marker types cause deep instantiation with Vue ref
    clusterMarkers.value.push(marker);
  }

  m.setPaintProperty(UNCLUSTERED_LAYER_ID, 'circle-color', resolveThemePrimaryColor());
};

const openPopupAt = (coords: [number, number], label: string): void => {
  const m = getMapOrReturn();
  if (!m) return;

  dismissAllPopups();
  const popup = new maplibregl.Popup()
    .setLngLat(coords)
    .setHTML(`<strong>${label}</strong>`)
    .addTo(m);
  popups.value.push(popup);
};

const flyToItem = (coords: [number, number]): void => {
  const m = getMapOrReturn();
  if (!m) return;

  m.flyTo({ center: coords, zoom: 15, duration: ANIMATION_DURATION_MS });
};

const panToVisibleArea = (coords: [number, number]): void => {
  const m = getMapOrReturn();
  if (!m) return;

  const bounds = m.getBounds();
  const [lng, lat] = coords;
  const isOutside =
    lng < bounds.getWest() ||
    lng > bounds.getEast() ||
    lat < bounds.getSouth() ||
    lat > bounds.getNorth();

  if (isOutside) {
    m.easeTo({ center: coords, duration: ANIMATION_DURATION_MS });
  }
};

const flashHighlightMarker = (): void => {
  const m = getMapOrReturn();
  if (!m) return;

  m.setPaintProperty(UNCLUSTERED_LAYER_ID, 'circle-stroke-width', HIGHLIGHT_STROKE_WIDTH);
  setTimeout(() => {
    m.setPaintProperty(UNCLUSTERED_LAYER_ID, 'circle-stroke-width', DEFAULT_STROKE_WIDTH);
  }, FLASH_HIGHLIGHT_DURATION_MS);
};

const focusOnItem = (item: GeoItem): void => {
  const m = getMapOrReturn();
  if (!m || !item || !item[props.geolocation]) return;

  const coords = (item[props.geolocation] as { coordinates: [number, number] }).coordinates;
  if (!coords) return;

  const label = resolveFieldTemplate(item, props.title);
  openPopupAt(coords, label);

  if (props.zoomOnClick) {
    flyToItem(coords);
  } else {
    panToVisibleArea(coords);
    flashHighlightMarker();
  }

  emit('select-item', item.id);
};

const resetMap = (): void => {
  const m = getMapOrReturn();
  if (!m) return;

  if (props.items.length > 0) {
    fitBoundsToItems();
  } else {
    m.setCenter(resolveMapCenter());
    m.setZoom(props.initialZoom ?? DEFAULT_ZOOM);
  }
};

const registerMapEvents = (): void => {
  const m = getMapOrReturn();
  if (!m) return;

  m.on('load', () => {
    m.addSource(SOURCE_ID, {
      type: 'geojson',
      data: buildGeoJson(),
      cluster: true,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterRadius: CLUSTER_RADIUS,
    });

    m.addLayer({
      id: CLUSTER_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          resolveThemePrimaryColor(),
          10,
          '#51bbd6c0',
          50,
          '#f28cb1cf',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
      },
    });

    m.addLayer({
      id: UNCLUSTERED_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': resolveThemePrimaryColor(),
        'circle-radius': 10,
        'circle-stroke-width': DEFAULT_STROKE_WIDTH,
        'circle-stroke-color': '#fff',
      },
    });

    m.on('click', UNCLUSTERED_LAYER_ID, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const title = feature.properties?.formattedTitle as string;
      const id = feature.properties?.id as string | number;

      while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
        coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
      }

      openPopupAt(coords, title);
      emit('select-item', id);
    });

    m.on('mouseenter', UNCLUSTERED_LAYER_ID, () => {
      m.getCanvas().style.cursor = CURSOR_POINTER;
    });
    m.on('mouseleave', UNCLUSTERED_LAYER_ID, () => {
      m.getCanvas().style.cursor = CURSOR_RESET;
    });

    m.on('click', CLUSTER_LAYER_ID, (e) => {
      const features = m.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] });
      const clusterFeature = features[0];
      if (!clusterFeature) return;

      const clusterId = clusterFeature.properties?.cluster_id as number;
      const source = m.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (!source) return;

      source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
        const coords = (clusterFeature.geometry as GeoJSON.Point).coordinates as [number, number];
        m.easeTo({ center: coords, zoom });
      });
    });

    m.on('mouseenter', CLUSTER_LAYER_ID, () => {
      m.getCanvas().style.cursor = CURSOR_POINTER;
    });
    m.on('mouseleave', CLUSTER_LAYER_ID, () => {
      m.getCanvas().style.cursor = CURSOR_RESET;
    });

    refreshClusterLabels();
    fitBoundsToItems();
  });

  m.on('moveend', () => {
    refreshClusterLabels();
  });
};

const resolveMapCenter = (): [number, number] => {
  const lng = props.centerLng ?? DEFAULT_CENTER[0];
  const lat = props.centerLat ?? DEFAULT_CENTER[1];
  return [lng, lat];
};

const initializeMap = (): void => {
  if (!mapContainer.value) return;

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center: resolveMapCenter(),
    zoom: props.initialZoom ?? DEFAULT_ZOOM,
  });

  registerMapEvents();
};

onMounted(() => {
  initializeMap();
});

watchEffect(() => {
  if (map.value && props.items.length > 0) {
    nextTick(() => {
      refreshClusterLabels();
      fitBoundsToItems();
    });
  }
});

defineExpose({ focusOnItem });
</script>

<style scoped>
.map-wrapper {
  position: relative;
  height: 60%;
  min-height: 300px;
}

.map-container {
  height: 100%;
  width: 100%;
  border-radius: var(--theme--border-radius);
}

.map-container :deep(.maplibregl-canvas) {
  border-radius: inherit;
}

.reset-map-btn {
  position: absolute;
  top: var(--content-padding);
  right: var(--content-padding);
  z-index: 29;
  --v-button-background-color: var(--theme--background);
  --v-button-background-color-hover: var(--theme--background-accent);
  box-shadow: var(--theme--elevation-2xl);
}

.reset-map-btn :deep(.v-icon) {
  --v-icon-color: var(--theme--primary);
}
</style>
