<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <VButton class="reset-map-btn" icon @click="resetMap" title="Reset view">
      <VIcon name="zoom_out_map" />
    </VButton>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  geolocation: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  zoomOnClick: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select-item']);

const mapContainer = ref(null);
const map = ref(null);
const popups = ref([]);
const clusterMarkers = ref([]);

const getThemePrimaryColor = () => {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--theme--primary').trim() || '#007bff';
};

const getFormattedTitle = (item) => {
  if (!props.title) return item.id;
  let formatted = props.title;
  const matches = formatted.match(/\{\{([^}]+)\}\}/g) || [];
  matches.forEach((match) => {
    const field = match.slice(2, -2);
    let value = item[field] || '';
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value = value.join(', ');
      } else if ('coordinates' in value) {
        value = `${value.coordinates[1]}, ${value.coordinates[0]}`;
      } else {
        const firstProp = Object.values(value)[0];
        value = firstProp !== undefined ? String(firstProp) : '[Object]';
      }
    }
    formatted = formatted.replace(match, value);
  });
  return formatted.trim() || item.id;
};

const initializeMap = () => {
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
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
        },
      ],
    },
    center: [0, 0],
    zoom: 1,
  });

  map.value.on('load', () => {
    map.value.addSource('points', {
      type: 'geojson',
      data: generateGeoJson(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 20,
    });

    map.value.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'points',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          getThemePrimaryColor(),
          10,
          '#51bbd6c0',
          50,
          '#f28cb1cf',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
      },
    });

    map.value.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'points',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': getThemePrimaryColor(),
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    map.value.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const title = e.features[0].properties.formattedTitle;
      const id = e.features[0].properties.id;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      closeAllPopups();
      const popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<strong>${title}</strong>`)
        .addTo(map.value);
      popups.value.push(popup);

      emit('select-item', id);
    });

    map.value.on('mouseenter', 'unclustered-point', () => {
      map.value.getCanvas().style.cursor = 'pointer';
    });
    map.value.on('mouseleave', 'unclustered-point', () => {
      map.value.getCanvas().style.cursor = '';
    });

    map.value.on('click', 'clusters', (e) => {
      const features = map.value.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties.cluster_id;
      map.value
        .getSource('points')
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          map.value.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
    });

    map.value.on('mouseenter', 'clusters', () => {
      map.value.getCanvas().style.cursor = 'pointer';
    });
    map.value.on('mouseleave', 'clusters', () => {
      map.value.getCanvas().style.cursor = '';
    });

    updateClusterMarkers();
    fitMapToMarkers();
    console.log('Map loaded successfully');
  });

  map.value.on('moveend', () => {
    updateClusterMarkers();
  });

  map.value.on('error', (e) => {
    console.error('Map error:', e);
  });
};

const generateGeoJson = () => {
  const geojson = {
    type: 'FeatureCollection',
    features: props.items
      .map((item) => {
        const coords = item[props.geolocation]?.coordinates;
        if (!coords || coords.length !== 2) {
          console.log('Item with invalid coordinates:', item);
          return null;
        }
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [coords[0], coords[1]],
          },
          properties: {
            id: item.id,
            formattedTitle: getFormattedTitle(item),
          },
        };
      })
      .filter((feature) => feature !== null),
  };
  console.log('Generated GeoJSON:', geojson);
  return geojson;
};

const fitMapToMarkers = () => {
  if (!map.value || props.items.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  props.items.forEach((item) => {
    const coords = item[props.geolocation]?.coordinates;
    if (coords && coords.length === 2) {
      bounds.extend([coords[0], coords[1]]);
    }
  });

  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1000,
    });
  }
};

const focusOnItem = (item) => {
  if (!map.value || !item || !item[props.geolocation]?.coordinates) {
    console.log('Unable to focus on item:', item);
    return;
  }

  const [longitude, latitude] = item[props.geolocation].coordinates;

  closeAllPopups();

  const popup = new maplibregl.Popup()
    .setLngLat([longitude, latitude])
    .setHTML(`<strong>${getFormattedTitle(item)}</strong>`)
    .addTo(map.value);
  popups.value.push(popup);

  if (props.zoomOnClick) {
    // Faz zoom no marcador se zoomOnClick for true
    map.value.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      duration: 1000,
    });
  } else {
    // Apenas destaca o marcador se zoomOnClick for false
    const bounds = map.value.getBounds();
    if (
      longitude < bounds.getWest() ||
      longitude > bounds.getEast() ||
      latitude < bounds.getSouth() ||
      latitude > bounds.getNorth()
    ) {
      // Move o mapa para enquadrar o ponto sem zoom
      map.value.easeTo({
        center: [longitude, latitude],
        duration: 1000,
      });
    }
    // Destaque temporário no marcador
    map.value.setPaintProperty('unclustered-point', 'circle-stroke-width', 4);
    setTimeout(() => {
      map.value.setPaintProperty('unclustered-point', 'circle-stroke-width', 2);
    }, 1000);
  }

  emit('select-item', item.id);
};

const resetMap = () => {
  if (!map.value) {
    console.log('Map not initialized');
    return;
  }
  // closeAllPopups();
  fitMapToMarkers();
};

const closeAllPopups = () => {
  popups.value.forEach((popup) => popup.remove());
  popups.value = [];
};

const updateClusterMarkers = () => {
  if (!map.value || !map.value.isStyleLoaded()) return;

  const source = map.value.getSource('points');
  if (!source) return;

  source.setData(generateGeoJson());

  clusterMarkers.value.forEach((marker) => marker.remove());
  clusterMarkers.value = [];

  const clusters = map.value.querySourceFeatures('points', { filter: ['has', 'point_count'] });
  console.log('Clusters found:', clusters);

  clusters.forEach((cluster) => {
    const pointCount = cluster.properties.point_count;
    const coordinates = cluster.geometry.coordinates;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-family', 'Arial');
    text.textContent = pointCount.toString();
    svg.appendChild(text);

    const markerElement = document.createElement('div');
    markerElement.appendChild(svg);
    markerElement.style.width = '40px';
    markerElement.style.height = '40px';
    markerElement.style.pointerEvents = 'none';

    const marker = new maplibregl.Marker({
      element: markerElement,
      offset: [0, 0],
    })
      .setLngLat(coordinates)
      .addTo(map.value);

    clusterMarkers.value.push(marker);
  });

  map.value.setPaintProperty('unclustered-point', 'circle-color', getThemePrimaryColor());
};

onMounted(() => {
  initializeMap();
});

watch(
  () => props.items,
  () => {
    updateClusterMarkers();
    fitMapToMarkers();
  },
  { deep: true }
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
  border: 1px solid var(--background-normal-alt);
}

.reset-map-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 29;
}
</style>
