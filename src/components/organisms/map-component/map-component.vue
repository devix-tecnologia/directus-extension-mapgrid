<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <MapToolbar @reset="resetMap" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapToolbar } from '../../molecules/map-toolbar/index.js';
import {
  GEO_ANIMATION_DURATION,
  GEO_CLUSTER_LAYER_ID,
  GEO_FIT_BOUNDS_MAX_ZOOM,
  GEO_POINT_LAYER_ID,
  GEO_SOURCE_ID,
  getItemCoordinates,
  type GeoItem,
  type GeoJsonFeature,
  type GeoJsonFeatureCollection,
} from '../../../services/geo/index.js';
import { resolveFieldTemplate } from '../../../services/value-formatter/index.js';
import type { MapComponentEmits, MapComponentProps } from './map-component.types';

const props = defineProps<MapComponentProps>();

const emit = defineEmits<MapComponentEmits>();

const mapContainer = ref<HTMLDivElement | null>(null);
const map = ref<maplibregl.Map | null>(null);
const popup = ref<maplibregl.Popup | null>(null);
const clusterMarkers = ref<maplibregl.Marker[]>([]);

const MARKER_SIZE = 40;
const SVG_NS = 'http://www.w3.org/2000/svg';

const resolveThemePrimaryColor = (): string => {
  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue('--theme--primary').trim() || '#007bff';
};

const buildGeoJson = (): GeoJsonFeatureCollection => {
  const features: GeoJsonFeature[] = [];

  for (const item of props.items) {
    const coords = getItemCoordinates(item, props.geolocation);
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
  const m = map.value;
  if (!m || props.items.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  for (const item of props.items) {
    const coords = getItemCoordinates(item, props.geolocation);
    if (coords) bounds.extend(coords);
  }

  if (!bounds.isEmpty()) {
    m.fitBounds(bounds, {
      padding: 50,
      maxZoom: GEO_FIT_BOUNDS_MAX_ZOOM,
      duration: GEO_ANIMATION_DURATION,
    });
  }
};

const dismissAllPopups = (): void => {
  popup.value?.remove();
  popup.value = null;
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
  const m = map.value;
  if (!m || !m.isStyleLoaded()) return;

  const source = m.getSource(GEO_SOURCE_ID);
  if (!source) return;

  source.setData(buildGeoJson());

  for (const marker of clusterMarkers.value) marker.remove();
  clusterMarkers.value = [];

  const clusters = m.querySourceFeatures(GEO_SOURCE_ID, { filter: ['has', 'point_count'] });

  for (const cluster of clusters) {
    const count = cluster.properties.point_count as number;
    const coords = cluster.geometry.coordinates as [number, number];

    const marker = new maplibregl.Marker({
      element: createClusterLabelElement(count),
      offset: [0, 0],
    })
      .setLngLat(coords)
      .addTo(m);

    clusterMarkers.value.push(marker);
  }

  m.setPaintProperty(GEO_POINT_LAYER_ID, 'circle-color', resolveThemePrimaryColor());
};

const openPopupAt = (coords: [number, number], label: string): void => {
  const m = map.value;
  if (!m) return;

  dismissAllPopups();
  popup.value = new maplibregl.Popup().setLngLat(coords).setHTML(`<strong>${label}</strong>`).addTo(m);
};

const flyToItem = (coords: [number, number]): void => {
  const m = map.value;
  if (!m) return;

  m.flyTo({ center: coords, zoom: 15, duration: GEO_ANIMATION_DURATION });
};

const panToVisibleArea = (coords: [number, number]): void => {
  const m = map.value;
  if (!m) return;

  const bounds = m.getBounds();
  const [lng, lat] = coords;
  const isOutside =
    lng < bounds.getWest() ||
    lng > bounds.getEast() ||
    lat < bounds.getSouth() ||
    lat > bounds.getNorth();

  if (isOutside) {
    m.easeTo({ center: coords, duration: GEO_ANIMATION_DURATION });
  }
};

const flashHighlightMarker = (): void => {
  const m = map.value;
  if (!m) return;

  m.setPaintProperty(GEO_POINT_LAYER_ID, 'circle-stroke-width', 4);
  setTimeout(() => {
    map.value?.setPaintProperty(GEO_POINT_LAYER_ID, 'circle-stroke-width', 2);
  }, GEO_ANIMATION_DURATION);
};

const focusOnItem = (item: GeoItem): void => {
  if (!map.value || !item) return;

  const coords = getItemCoordinates(item, props.geolocation);
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
  fitBoundsToItems();
};

const registerMapEvents = (): void => {
  const m = map.value;
  if (!m) return;

  m.on('load', () => {
    m.addSource(GEO_SOURCE_ID, {
      type: 'geojson',
      data: buildGeoJson(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 20,
    });

    m.addLayer({
      id: GEO_CLUSTER_LAYER_ID,
      type: 'circle',
      source: GEO_SOURCE_ID,
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
      id: GEO_POINT_LAYER_ID,
      type: 'circle',
      source: GEO_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': resolveThemePrimaryColor(),
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    m.on('click', GEO_POINT_LAYER_ID, (e) => {
      const feature = e.features![0];
      const coords = feature.geometry.coordinates.slice() as [number, number];
      const title = feature.properties.formattedTitle as string;
      const id = feature.properties.id as string | number;

      while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
        coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
      }

      openPopupAt(coords, title);
      emit('select-item', id);
    });

    m.on('mouseenter', GEO_POINT_LAYER_ID, () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', GEO_POINT_LAYER_ID, () => {
      m.getCanvas().style.cursor = '';
    });

    m.on('click', GEO_CLUSTER_LAYER_ID, (e) => {
      const features = m.queryRenderedFeatures(e.point, { layers: [GEO_CLUSTER_LAYER_ID] });
      const clusterId = features[0].properties.cluster_id;
      m.getSource(GEO_SOURCE_ID)!
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          m.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
    });

    m.on('mouseenter', GEO_CLUSTER_LAYER_ID, () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', GEO_CLUSTER_LAYER_ID, () => {
      m.getCanvas().style.cursor = '';
    });

    refreshClusterLabels();
    fitBoundsToItems();
  });

  m.on('moveend', () => {
    refreshClusterLabels();
  });
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
    center: [0, 0],
    zoom: 1,
  });

  registerMapEvents();
};

onMounted(() => {
  initializeMap();
});

watch(
  () => props.items,
  () => {
    refreshClusterLabels();
    fitBoundsToItems();
  },
  { deep: true },
);

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
  overflow: hidden;
}
</style>
