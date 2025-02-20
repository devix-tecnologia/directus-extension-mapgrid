<template>
  <div class="directus-table-layout">
    <div v-if="loading" class="loading-container">
      <loader />
    </div>

    <div v-else class="layout-container">
      <div class="map-wrapper">
        <div ref="mapContainer" class="map-container"></div>
        <VButton class="reset-map-btn" @click="resetMap">Reset View</VButton>
      </div>

      <div class="table-container">
        <div class="table-header">
          <div v-for="header in headers" :key="header.value" class="table-header-item">
            {{ header.text }}
          </div>
        </div>

        <div
          v-for="item in items"
          v-if="items && items.length > 0"
          :key="item.id"
          class="table-row item-lista"
          @click="focusOnItem(item)"
        >
          <div v-for="header in headers" :key="header.value" class="table-cell">
            {{ formatValue(item, header.value) }}
          </div>
          <div class="actions">
            <VButton
              class="edit-btn"
              rounded
              icon
              outlined
              small
              @click.stop="editItem(item)"
              title="Edit"
            >
              <VIcon small name="edit" />
            </VButton>
          </div>
        </div>
        <div v-else class="no-items-message">No items found.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'vue-router';

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  collection: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'name',
  },
  geolocation: {
    type: String,
    default: 'geolocation',
  },
  coluna1: String,
  coluna2: String,
  coluna3: String,
  coluna4: String,
  coluna5: String,
});

const router = useRouter();
const mapContainer = ref(null);
const map = ref(null);
const markers = ref([]);

const headers = computed(() => {
  const columns = [
    props.coluna1,
    props.coluna2,
    props.coluna3,
    props.coluna4,
    props.coluna5,
  ].filter(Boolean);

  return columns.map((column) => ({
    text: column,
    value: column,
  }));
});

const formatValue = (item, field) => {
  if (!item || !field) return '';
  if (!Object.prototype.hasOwnProperty.call(item, field)) return '';
  const value = item[field];
  return value === null || value === undefined ? '' : value;
};

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

    // Custom marker element
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
    padding: 50, // Padding around points
    maxZoom: 15, // Maximum zoom limit
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
  fitMapToMarkers(); // Reset to show all markers
};

// Open the item edit screen
const editItem = (item) => {
  router.push(`/content/${props.collection}/${item.id}`);
};

onMounted(() => {
  initializeMap();
});

watch(
  () => props.items,
  () => {
    updateMarkers();
    fitMapToMarkers(); // Adjust map whenever items change
  },
  { deep: true }
);

// Debug
watch(
  () => props.items,
  (newItems) => {
    console.log('Raw items:', newItems);
  },
  { immediate: true }
);
</script>

<style scoped>
.directus-table-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: 16px;
  position: relative;
}

.layout-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

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

.table-container {
  height: 40%;
  overflow-y: auto;
  background: var(--theme--background);
  border-radius: 8px;
  border: 1px solid var(--background-normal-alt);
  position: relative;
}

.table-header {
  display: flex;
  position: sticky;
  top: 0;
  background-color: var(--theme--background);
  z-index: 1;
}

.table-header-item {
  flex: 1;
  padding: 12px 16px;
  font-weight: bold;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-bottom: 2px solid var(--background-normal-alt);
  text-transform: uppercase;
  font-size: 12px;
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--background-normal-alt);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
  position: relative;
}

.table-row:hover {
  background-color: var(--theme--primary-background);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.table-row:hover .edit-btn {
  opacity: 1;
}

.table-cell {
  flex: 1;
  padding: 12px 16px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
}

.no-items-message {
  padding: 16px;
  text-align: center;
  color: var(--theme--foreground-subdued);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
