<template>
  <div class="directus-table-layout">
    <div v-if="loading" class="loading-container">
      <loader />
    </div>

    <div v-else class="layout-container">
      <!-- Mapa -->
      <div class="map-container" ref="mapContainer" id="map"></div>

      <!-- Tabela -->
      <div class="table-container">
        <!-- Botão para voltar à visualização inicial -->
        <button v-if="map" class="reset-map-btn" @click="resetMap">
          Reset view
        </button>
        <div class="table-header">
          <div
            v-for="header in headers"
            :key="header.value"
            class="table-header-item"
          >
            {{ header.text }}
          </div>
        </div>

        <div
          v-for="item in items"
          :key="item.id"
          class="table-row"
          @click="focusOnItem(item)"
        >
          <div v-for="header in headers" :key="header.value" class="table-cell">
            {{ item[header.value] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  fields: {
    type: Array,
    required: true,
  },
  collection: {
    type: String,
    required: true,
  },
});

const router = useRouter();
const mapContainer = ref(null);
const map = ref(null);
const markers = ref(new Map()); // Usando Map para melhor gerenciamento de chaves

const headers = computed(() =>
  props.fields.map((field) => ({
    text: field,
    value: field,
  }))
);

// Definição de ícone personalizado
const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div class="marker-inner" style="
        width: 30px;
        height: 30px;
        background-color: var(--theme--primary);
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Inicializar o mapa
const initializeMap = () => {
  if (!mapContainer.value || map.value) return;

  map.value = L.map(mapContainer.value).setView(
    [-19.629323252716748, -40.32739397081107],
    7
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map.value);

  // Forçar o mapa a atualizar seu tamanho
  setTimeout(() => {
    map.value?.invalidateSize();
  }, 100);
};

// Atualizar marcadores
const updateMarkers = () => {
  if (!map.value) return;

  // Limpar marcadores existentes
  markers.value.forEach((marker) => {
    marker.remove();
  });
  markers.value.clear();

  // Adicionar novos marcadores
  props.items.forEach((item) => {
    const coordinates = item.mapa?.coordinates;

    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      console.warn(`Invalid coordinates for item ${item.id}:`, coordinates);
      return;
    }

    const [longitude, latitude] = coordinates;

    if (!isValidCoordinate(latitude, longitude)) {
      console.warn(
        `Invalid latitude/longitude for item ${item.id}: ${latitude}, ${longitude}`
      );
      return;
    }

    try {
      const marker = L.marker([latitude, longitude], {
        icon: createCustomIcon(),
      }).addTo(map.value).bindPopup(`
          <div class="marker-popup">
            <strong>${item.nome || "Unnamed Location"}</strong>
          </div>
        `);

      markers.value.set(item.id, marker);
    } catch (error) {
      console.error(`Error creating marker for item ${item.id}:`, error);
    }
  });
};

//  Validar coordenadas
const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
};

// Focar no item
const focusOnItem = (item) => {
  const coordinates = item.mapa?.coordinates;
  if (!coordinates || !map.value) return;

  const [longitude, latitude] = coordinates;

  if (!isValidCoordinate(latitude, longitude)) return;

  // Primeiro, vamos parar qualquer animação em andamento
  map.value.stop();

  // Usar setView em vez de flyTo para garantir posicionamento consistente
  map.value.setView([latitude, longitude], 15, {
    animate: true,
    duration: 0.5, // Reduzindo a duração da animação
    easeLinearity: 1, // Movimento mais linear
    noMoveStart: true, // Previne eventos de movimento indesejados
  });

  // Garantir que o mapa está centralizado após a animação
  setTimeout(() => {
    map.value?.setView([latitude, longitude], 15, {
      animate: false,
    });

    const marker = markers.value.get(item.id);
    if (marker) {
      marker.openPopup();
    }
  }, 100); // Um pouco mais que a duração da animação
};

// Observar alterações nos itens
watch(() => props.items, updateMarkers, { deep: true });

// Hooks de vida
onMounted(() => {
  if (!map.value) {
    initializeMap();
  }
  updateMarkers();

  // Adicionar evento de redimensionamento do mapa
  const resizeHandler = () => {
    map.value?.invalidateSize();
  };

  window.addEventListener("resize", resizeHandler);
});

onUnmounted(() => {
  // Remover marcadores e mapa
  markers.value.forEach((marker) => marker.remove());
  if (map.value) {
    map.value.remove();
  }

  // Remover o evento de redimensionamento
  window.removeEventListener("resize", resizeHandler);
});

// Função para voltar à visualização inicial
const resetMap = () => {
  if (map.value) {
    // Coordenada inicial e zoom
    const initialLatLng = [-19.629323252716748, -40.32739397081107];
    const initialZoom = 7;

    // Centralizar o mapa na posição inicial
    map.value.setView(initialLatLng, initialZoom, {
      animate: true,
      duration: 0.5, // Duração da animação
    });
  }
};
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

.map-container {
  height: 50vh;
  min-height: 300px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--background-normal-alt);
}

.table-container {
  flex: 1;
  overflow-y: auto;
  background: var(--theme--background);
  border-radius: 8px;
  border: 1px solid var(--background-normal-alt);
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
  font-weight: 600;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-bottom: 2px solid var(--background-normal-alt);
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--background-normal-alt);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: var(--theme--primary-background);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.table-cell {
  flex: 1;
  padding: 12px 16px;
}

.reset-map-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: var(--theme--primary);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
  z-index: 9999999;
}

.reset-map-btn:hover {
  background-color: var(--theme--primary-background);
}

.reset-map-btn:focus {
  outline: none;
}

/* Marker popup styles */
:global(.marker-popup) {
  padding: 8px;
  text-align: center;
}

:global(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

:global(.custom-map-marker) {
  background: transparent;
  border: none;
}
</style>
