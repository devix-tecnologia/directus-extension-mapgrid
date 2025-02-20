<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    <VButton class="reset-map-btn" @click="resetMap">Reset View</VButton>
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
});

const emit = defineEmits(['focus-on-item']);

const mapContainer = ref(null);
const map = ref(null);
const markers = ref([]);

// Initialize the map and calculate center/bounds based on items
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
    center: [0, 0], // Temporary initial center
    zoom: 1, // Minimum initial zoom until bounds are adjusted
  });

  map.value.on('load', () => {
    updateMarkers();
    fitMapToMarkers();
    console.log('Map loaded successfully');
  });

  map.value.on('error', (e) => {
    console.error('Map error:', e);
  });
};

// Update markers with a custom icon
const updateMarkers = () => {
  if (!map.value) return;

  markers.value.forEach((marker) => marker.remove());
  markers.value = [];

  props.items.forEach((item) => {
    const coords = item[props.geolocation]?.coordinates;
    if (!coords || coords.length !== 2) {
      console.log('Item with invalid coordinates:', item);
      return;
    }

    const [longitude, latitude] = coords;

    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.backgroundColor = 'var(--theme--primary)';
    markerElement.style.width = '30px';
    markerElement.style.height = '30px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    markerElement.style.cursor = 'pointer';

    const marker = new maplibregl.Marker({ element: markerElement })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup().setHTML(`<strong>${item[props.title] || item.id}</strong>`))
      .addTo(map.value);

    markers.value.push(marker);
  });
  console.log('Markers updated:', markers.value);
};

// Adjust the map to show all markers
const fitMapToMarkers = () => {
  if (!map.value || markers.value.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  markers.value.forEach((marker) => {
    bounds.extend(marker.getLngLat());
  });

  map.value.fitBounds(bounds, {
    padding: 50,
    maxZoom: 15,
    duration: 1000,
  });
};

const focusOnItem = (item) => {
  if (!map.value || !item || !item[props.geolocation]?.coordinates) {
    console.log('Unable to focus on item:', item);
    return;
  }

  const [longitude, latitude] = item[props.geolocation].coordinates;
  map.value.flyTo({
    center: [longitude, latitude],
    zoom: 15,
    duration: 1000,
  });
};

const resetMap = () => {
  if (!map.value) {
    console.log('Map not initialized');
    return;
  }
  fitMapToMarkers();
};

onMounted(() => {
  initializeMap();
});

watch(
  () => props.items,
  () => {
    updateMarkers();
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
  border-radius: 8px;
  border: 1px solid var(--background-normal-alt);
}

.reset-map-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 29;
}
</style>
