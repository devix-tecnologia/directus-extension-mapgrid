<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <v-button v-tooltip="'Reset view'" class="reset-map-btn" icon rounded @click="resetMap">
      <v-icon name="zoom_out_map" />
    </v-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, watchEffect, nextTick } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface GeoItem {
  id: string | number;
  [key: string]: unknown;
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { id: string | number; formattedTitle: string };
}

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

const MARKER_SIZE = 40;
const SVG_NS = 'http://www.w3.org/2000/svg';

const resolveThemePrimaryColor = (): string => {
  const computed = getComputedStyle(document.documentElement);
  return computed.getPropertyValue('--theme--primary').trim() || '#007bff';
};

const resolveFieldTemplate = (item: GeoItem, template: string): string => {
  if (!template) return String(item.id);
  let result = template;
  const fieldPattern = /\{\{([^}]+)\}\}/g;
  const matches = result.match(fieldPattern) || [];

  for (const match of matches) {
    const fieldName = match.slice(2, -2);
    const raw = item[fieldName];
    const resolved = resolveFieldValue(raw);
    result = result.replace(match, resolved);
  }

  return result.trim() || String(item.id);
};

const resolveFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if ('coordinates' in (value as Record<string, unknown>)) {
    const geo = value as { coordinates: [number, number] };
    return `${geo.coordinates[1]}, ${geo.coordinates[0]}`;
  }
  const first = Object.values(value as Record<string, unknown>)[0];
  return first !== undefined ? String(first) : '[Object]';
};

const buildGeoJson = (): { type: 'FeatureCollection'; features: GeoJsonFeature[] } => {
  const features: GeoJsonFeature[] = [];

  for (const item of props.items) {
    const coords = (item[props.geolocation] as { coordinates?: [number, number] } | undefined)
      ?.coordinates;
    if (!coords || coords.length !== 2) continue;

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [coords[0], coords[1]] },
      properties: { id: item.id, formattedTitle: resolveFieldTemplate(item, props.title) },
    });
  }

  return { type: 'FeatureCollection', features };
};

const fitBoundsToItems = (): void => {
  if (!map.value || props.items.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  for (const item of props.items) {
    const coords = (item[props.geolocation] as { coordinates?: [number, number] } | undefined)
      ?.coordinates;
    if (coords && coords.length === 2) {
      bounds.extend([coords[0], coords[1]]);
    }
  }

  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 });
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
  if (!map.value || !map.value.isStyleLoaded()) return;

  const source = map.value.getSource('points');
  if (!source) return;

  source.setData(buildGeoJson());

  for (const marker of clusterMarkers.value) marker.remove();
  clusterMarkers.value = [];

  const clusters = map.value.querySourceFeatures('points', { filter: ['has', 'point_count'] });

  for (const cluster of clusters) {
    const count = cluster.properties.point_count as number;
    const coords = cluster.geometry.coordinates as [number, number];

    const marker = new maplibregl.Marker({
      element: createClusterLabelElement(count),
      offset: [0, 0],
    })
      .setLngLat(coords)
      .addTo(map.value);

    clusterMarkers.value.push(marker);
  }

  map.value.setPaintProperty('unclustered-point', 'circle-color', resolveThemePrimaryColor());
};

const openPopupAt = (coords: [number, number], label: string): void => {
  dismissAllPopups();
  const popup = new maplibregl.Popup()
    .setLngLat(coords)
    .setHTML(`<strong>${label}</strong>`)
    .addTo(map.value!);
  popups.value.push(popup);
};

const flyToItem = (coords: [number, number]): void => {
  map.value!.flyTo({ center: coords, zoom: 15, duration: 1000 });
};

const panToVisibleArea = (coords: [number, number]): void => {
  const bounds = map.value!.getBounds();
  const [lng, lat] = coords;
  const isOutside =
    lng < bounds.getWest() ||
    lng > bounds.getEast() ||
    lat < bounds.getSouth() ||
    lat > bounds.getNorth();

  if (isOutside) {
    map.value!.easeTo({ center: coords, duration: 1000 });
  }
};

const flashHighlightMarker = (): void => {
  map.value!.setPaintProperty('unclustered-point', 'circle-stroke-width', 4);
  setTimeout(() => {
    map.value?.setPaintProperty('unclustered-point', 'circle-stroke-width', 2);
  }, 1000);
};

const focusOnItem = (item: GeoItem): void => {
  if (!map.value || !item || !item[props.geolocation]) return;

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
  if (!map.value) return;
  if (props.items.length > 0) {
    fitBoundsToItems();
  } else {
    map.value.setCenter(resolveMapCenter());
    map.value.setZoom(props.initialZoom ?? DEFAULT_ZOOM);
  }
};

const registerMapEvents = (): void => {
  const m = map.value!;

  m.on('load', () => {
    m.addSource('points', {
      type: 'geojson',
      data: buildGeoJson(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 20,
    });

    m.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'points',
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
      id: 'unclustered-point',
      type: 'circle',
      source: 'points',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': resolveThemePrimaryColor(),
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    m.on('click', 'unclustered-point', (e) => {
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

    m.on('mouseenter', 'unclustered-point', () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'unclustered-point', () => {
      m.getCanvas().style.cursor = '';
    });

    m.on('click', 'clusters', (e) => {
      const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties.cluster_id;
      m.getSource('points')!
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          m.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
    });

    m.on('mouseenter', 'clusters', () => {
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'clusters', () => {
      m.getCanvas().style.cursor = '';
    });

    refreshClusterLabels();
    fitBoundsToItems();
  });

  m.on('moveend', () => {
    refreshClusterLabels();
  });

  m.on('error', () => {});
};

const DEFAULT_CENTER: [number, number] = [-47.9292, -15.7801];
const DEFAULT_ZOOM = 4;

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

let previousItemCount = 0;

watchEffect(() => {
  const currentCount = props.items.length;
  if (map.value && currentCount > 0 && currentCount !== previousItemCount) {
    previousItemCount = currentCount;
    nextTick(() => {
      refreshClusterLabels();
      fitBoundsToItems();
    });
  }
});

watch(
  () => props.items,
  () => {
    nextTick(() => {
      refreshClusterLabels();
      fitBoundsToItems();
    });
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
