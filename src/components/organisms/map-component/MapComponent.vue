<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <MapToolbar @reset="resetMapView" />
  </div>
</template>

<script setup lang="ts">
import maplibregl, { type FilterSpecification } from 'maplibre-gl';
import { nextTick, onMounted, onUnmounted, type Ref, ref, watchEffect } from 'vue';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoItem, PointCoordinates } from '../../../contract/index.js';
import { itemPointCoordinates } from '../../../contract/index.js';
import {
  buildPointFeatureCollection,
  coordinatesNearest,
  GEO_ANIMATION_DURATION,
  GEO_CLUSTER_LAYER_ID,
  GEO_CLUSTER_MAX_ZOOM,
  GEO_CLUSTER_RADIUS,
  GEO_FIT_BOUNDS_MAX_ZOOM,
  GEO_POINT_LAYER_ID,
  GEO_SOURCE_ID,
  isOutsideBounds,
  parseClusterFeature,
  parseClusterFeatures,
  parseMarkerFeature,
  resolveMapCenter,
  resolveMapZoom,
} from '../../../services/geo/index.js';
import { resolveFieldTemplate } from '../../../services/value-formatter/index.js';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';
import type { MapComponentEmits, MapComponentProps } from './MapComponent.types';

const props = defineProps<MapComponentProps>();

const emit = defineEmits<MapComponentEmits>();

const CLUSTER_FILTER: FilterSpecification = ['has', 'point_count'];
const UNCLUSTERED_FILTER: FilterSpecification = ['!', ['has', 'point_count']];
const MARKER_SIZE = 40;
const SVG_NS = 'http://www.w3.org/2000/svg';
const FIT_BOUNDS_PADDING = 50;
const FOCUS_ZOOM = 15;
const HIGHLIGHT_STROKE_WIDTH = 4;
const DEFAULT_STROKE_WIDTH = 2;
const CURSOR_POINTER = 'pointer';
const CURSOR_RESET = '';
const FLASH_HIGHLIGHT_DURATION_MS = 1000;

interface CameraState {
  center: PointCoordinates;
  zoom: number;
}

const mapContainer = ref<HTMLDivElement | null>(null);
const map: Ref<maplibregl.Map | null> = ref(null);
let activePopups: maplibregl.Popup[] = [];
let clusterMarkers: maplibregl.Marker[] = [];
let resizeObserver: ResizeObserver | null = null;
let highlightResetTimer: ReturnType<typeof setTimeout> | null = null;
let hasPerformedInitialFitBounds = false;

const getMap = (): maplibregl.Map | null => map.value;

const resolveThemePrimaryColor = (): string => {
  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue('--theme--primary').trim() || '#007bff';
};

const buildFeatureCollection = () =>
  buildPointFeatureCollection({
    items: props.items,
    geolocationField: props.geolocation,
    titleTemplate: props.title,
  });

const getCameraState = (): CameraState | null => {
  const instance = getMap();
  if (!instance) return null;
  return { center: instance.getCenter().toArray(), zoom: instance.getZoom() };
};

/**
 * Publica a camera nos data-attributes do container. O canvas do WebGL nao
 * expoe nada que um teste de navegador possa ler, entao e por aqui que o e2e
 * verifica para onde o mapa foi.
 */
const syncCameraMetadata = (instance: maplibregl.Map): void => {
  if (!mapContainer.value) return;
  const center = instance.getCenter().toArray();
  mapContainer.value.dataset.center = center.join(',');
  mapContainer.value.dataset.zoom = String(instance.getZoom());
};

const fitBoundsToItems = (): void => {
  const instance = getMap();
  if (!instance || props.items.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  for (const item of props.items) {
    const coords = itemPointCoordinates(item, props.geolocation);
    if (coords) {
      bounds.extend(coords);
    }
  }

  if (!bounds.isEmpty()) {
    instance.fitBounds(bounds, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: GEO_FIT_BOUNDS_MAX_ZOOM,
      duration: GEO_ANIMATION_DURATION,
    });
  }
};

/**
 * O enquadramento automatico roda uma vez so. Cada refetch da lista reexecutava
 * o fitBounds, que cancelava o flyTo disparado por um clique na grade e devolvia
 * a camera ao Brasil inteiro no meio da animacao. Reenquadrar depois disso e
 * escolha do usuario, pelo botao do MapToolbar.
 */
const performInitialFitBoundsOnce = (): void => {
  if (hasPerformedInitialFitBounds) return;
  hasPerformedInitialFitBounds = true;
  fitBoundsToItems();
};

const dismissAllPopups = (): void => {
  for (const popup of activePopups) popup.remove();
  activePopups = [];
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
  const instance = getMap();
  if (!instance?.isStyleLoaded()) return;

  const source = instance.getSource<maplibregl.GeoJSONSource>(GEO_SOURCE_ID);
  if (!source) return;

  source.setData(buildFeatureCollection());

  for (const marker of clusterMarkers) marker.remove();
  clusterMarkers = [];

  const clusters = parseClusterFeatures(
    instance.querySourceFeatures(GEO_SOURCE_ID, { filter: ['has', 'point_count'] })
  );

  for (const cluster of clusters) {
    const marker = new maplibregl.Marker({
      element: createClusterLabelElement(cluster.pointCount),
      offset: [0, 0],
    })
      .setLngLat(cluster.coordinates)
      .addTo(instance);

    clusterMarkers.push(marker);
  }

  instance.setPaintProperty(GEO_POINT_LAYER_ID, 'circle-color', resolveThemePrimaryColor());
  syncCameraMetadata(instance);
};

const openPopupAt = (coords: PointCoordinates, label: string): void => {
  const instance = getMap();
  if (!instance) return;

  dismissAllPopups();
  const popup = new maplibregl.Popup()
    .setLngLat(coords)
    .setHTML(`<strong>${label}</strong>`)
    .addTo(instance);
  activePopups.push(popup);
};

const flyToItem = (coords: PointCoordinates): void => {
  const instance = getMap();
  if (!instance) return;

  instance.flyTo({ center: coords, zoom: FOCUS_ZOOM, duration: GEO_ANIMATION_DURATION });
};

const panToVisibleArea = (coords: PointCoordinates): void => {
  const instance = getMap();
  if (!instance) return;

  if (isOutsideBounds(coords, instance.getBounds())) {
    instance.easeTo({ center: coords, duration: GEO_ANIMATION_DURATION });
  }
};

const flashHighlightMarker = (): void => {
  const instance = getMap();
  if (!instance) return;

  instance.setPaintProperty(GEO_POINT_LAYER_ID, 'circle-stroke-width', HIGHLIGHT_STROKE_WIDTH);
  if (highlightResetTimer) clearTimeout(highlightResetTimer);
  highlightResetTimer = setTimeout(() => {
    highlightResetTimer = null;
    getMap()?.setPaintProperty(GEO_POINT_LAYER_ID, 'circle-stroke-width', DEFAULT_STROKE_WIDTH);
  }, FLASH_HIGHLIGHT_DURATION_MS);
};

const resetMapView = (): void => {
  fitBoundsToItems();
};

const focusOnItem = (item: GeoItem): void => {
  const instance = getMap();
  const coords = itemPointCoordinates(item, props.geolocation);
  if (!instance || !coords) return;

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

const registerMapEvents = (): void => {
  const instance = getMap();
  if (!instance) return;

  instance.on('load', () => {
    instance.addSource(GEO_SOURCE_ID, {
      type: 'geojson',
      data: buildFeatureCollection(),
      cluster: true,
      clusterMaxZoom: GEO_CLUSTER_MAX_ZOOM,
      clusterRadius: GEO_CLUSTER_RADIUS,
    });

    instance.addLayer({
      id: GEO_CLUSTER_LAYER_ID,
      type: 'circle',
      source: GEO_SOURCE_ID,
      filter: CLUSTER_FILTER,
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

    instance.addLayer({
      id: GEO_POINT_LAYER_ID,
      type: 'circle',
      source: GEO_SOURCE_ID,
      filter: UNCLUSTERED_FILTER,
      paint: {
        'circle-color': resolveThemePrimaryColor(),
        'circle-radius': 10,
        'circle-stroke-width': DEFAULT_STROKE_WIDTH,
        'circle-stroke-color': '#fff',
      },
    });

    instance.on('click', GEO_POINT_LAYER_ID, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const marker = parseMarkerFeature(feature);
      if (!marker) return;

      openPopupAt(coordinatesNearest(marker.coordinates, event.lngLat.lng), marker.formattedTitle);
      emit('select-item', marker.id);
    });

    instance.on('mouseenter', GEO_POINT_LAYER_ID, () => {
      instance.getCanvas().style.cursor = CURSOR_POINTER;
    });
    instance.on('mouseleave', GEO_POINT_LAYER_ID, () => {
      instance.getCanvas().style.cursor = CURSOR_RESET;
    });

    instance.on('click', GEO_CLUSTER_LAYER_ID, (event) => {
      const features = instance.queryRenderedFeatures(event.point, {
        layers: [GEO_CLUSTER_LAYER_ID],
      });
      const firstFeature = features[0];
      if (!firstFeature) return;

      const cluster = parseClusterFeature(firstFeature);
      const source = instance.getSource<maplibregl.GeoJSONSource>(GEO_SOURCE_ID);
      if (!cluster || !source) return;

      source.getClusterExpansionZoom(cluster.clusterId).then((zoom: number) => {
        instance.easeTo({ center: cluster.coordinates, zoom });
      });
    });

    instance.on('mouseenter', GEO_CLUSTER_LAYER_ID, () => {
      instance.getCanvas().style.cursor = CURSOR_POINTER;
    });
    instance.on('mouseleave', GEO_CLUSTER_LAYER_ID, () => {
      instance.getCanvas().style.cursor = CURSOR_RESET;
    });

    refreshClusterLabels();
    performInitialFitBoundsOnce();
  });

  instance.on('moveend', () => {
    syncCameraMetadata(instance);
    refreshClusterLabels();
  });

  syncCameraMetadata(instance);
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
    center: resolveMapCenter(props),
    zoom: resolveMapZoom(props),
  });

  registerMapEvents();
};

const observeContainerResize = (): void => {
  if (!mapContainer.value || typeof ResizeObserver === 'undefined') return;

  resizeObserver = new ResizeObserver(() => {
    getMap()?.resize();
  });
  resizeObserver.observe(mapContainer.value);
};

const releaseMapResources = (): void => {
  if (highlightResetTimer) {
    clearTimeout(highlightResetTimer);
    highlightResetTimer = null;
  }

  resizeObserver?.disconnect();
  resizeObserver = null;

  for (const marker of clusterMarkers) marker.remove();
  clusterMarkers = [];

  dismissAllPopups();

  map.value?.remove();
  map.value = null;
};

onMounted(() => {
  initializeMap();
  observeContainerResize();
});

onUnmounted(() => {
  releaseMapResources();
});

watchEffect(() => {
  if (map.value && props.items.length > 0) {
    nextTick(() => {
      refreshClusterLabels();
      performInitialFitBoundsOnce();
    });
  }
});

defineExpose({ focusOnItem, getCameraState });
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--theme--border-radius);
  overflow: hidden;
}

.map-container :deep(.maplibregl-canvas) {
  border-radius: inherit;
}
</style>
