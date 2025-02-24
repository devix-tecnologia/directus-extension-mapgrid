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
});

const mapContainer = ref(null);
const map = ref(null);
const popups = ref([]); // Armazena os popups abertos
const clusterMarkers = ref([]); // Armazena os marcadores de cluster com SVG

// Obtém a cor computada de var(--theme--primary)
const getThemePrimaryColor = () => {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--theme--primary').trim() || '#007bff'; // Fallback para azul padrão
};

// Interpreta o template de título para um item
const getFormattedTitle = (item) => {
  if (!props.title) return item.id;
  let formatted = props.title;
  const matches = formatted.match(/\{\{([^}]+)\}\}/g) || [];
  matches.forEach((match) => {
    const field = match.slice(2, -2); // Remove {{ e }}
    let value = item[field] || '';
    // Trata valores que são objetos
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        // Se for array (ex.: coordinates), usa como string
        value = value.join(', ');
      } else if ('coordinates' in value) {
        // Caso especial para geolocation com coordinates
        value = `${value.coordinates[1]}, ${value.coordinates[0]}`; // lat, lng
      } else {
        // Pega a primeira propriedade do objeto como fallback
        const firstProp = Object.values(value)[0];
        value = firstProp !== undefined ? String(firstProp) : '[Object]';
      }
    }
    formatted = formatted.replace(match, value);
  });
  return formatted.trim() || item.id; // Usa ID como fallback se vazio
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
    // Adiciona a fonte de dados com clustering
    map.value.addSource('points', {
      type: 'geojson',
      data: generateGeoJson(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Camada para clusters (com suas cores atualizadas)
    map.value.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'points',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          getThemePrimaryColor(), // Menos de 10 pontos
          10,
          '#51bbd6c0', // 10-50 pontos
          50,
          '#f28cb1cf', // Mais de 50 pontos
        ],
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
      },
    });

    // Camada para pontos individuais
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

    // Clique em pontos individuais para abrir popup
    map.value.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const title = e.features[0].properties.formattedTitle;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<strong>${title}</strong>`)
        .addTo(map.value);

      popups.value.push(popup);
    });

    // Cursor pointer ao passar sobre pontos individuais
    map.value.on('mouseenter', 'unclustered-point', () => {
      map.value.getCanvas().style.cursor = 'pointer';
    });
    map.value.on('mouseleave', 'unclustered-point', () => {
      map.value.getCanvas().style.cursor = '';
    });

    // Clique em cluster para expandir
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

    // Cursor pointer ao passar sobre clusters
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

  // Atualiza clusters ao mudar o zoom ou mover o mapa
  map.value.on('moveend', () => {
    updateClusterMarkers();
  });

  map.value.on('error', (e) => {
    console.error('Map error:', e);
  });
};

// Gera GeoJSON a partir dos itens com título formatado
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
            coordinates: [coords[0], coords[1]], // [longitude, latitude]
          },
          properties: {
            id: item.id,
            formattedTitle: getFormattedTitle(item), // Usa título formatado
          },
        };
      })
      .filter((feature) => feature !== null),
  };
  console.log('Generated GeoJSON:', geojson);
  return geojson;
};

// Ajusta o mapa para mostrar todos os pontos
const fitMapToMarkers = () => {
  if (!map.value || props.items.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  props.items.forEach((item) => {
    const coords = item[props.geolocation]?.coordinates;
    if (coords && coords.length === 2) {
      bounds.extend([coords[0], coords[1]]); // [longitude, latitude]
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

  // Fecha todos os popups existentes
  closeAllPopups();

  // Cria e abre um novo popup para o item focado
  const popup = new maplibregl.Popup()
    .setLngLat([longitude, latitude])
    .setHTML(`<strong>${getFormattedTitle(item)}</strong>`) // Usa título formatado
    .addTo(map.value);

  popups.value.push(popup);

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
  closeAllPopups(); // Fecha todos os popups ao resetar
  fitMapToMarkers();
};

// Fecha todos os popups abertos
const closeAllPopups = () => {
  popups.value.forEach((popup) => popup.remove());
  popups.value = [];
};

// Atualiza os marcadores e clusters com contagem
const updateClusterMarkers = () => {
  if (!map.value || !map.value.isStyleLoaded()) return;

  const source = map.value.getSource('points');
  if (!source) return;

  source.setData(generateGeoJson());

  // Remove marcadores de cluster existentes
  clusterMarkers.value.forEach((marker) => marker.remove());
  clusterMarkers.value = [];

  // Obtém os clusters renderizados
  const clusters = map.value.querySourceFeatures('points', { filter: ['has', 'point_count'] });
  console.log('Clusters found:', clusters);

  clusters.forEach((cluster) => {
    const pointCount = cluster.properties.point_count;
    const coordinates = cluster.geometry.coordinates;

    // Cria um SVG para o número do cluster
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
    markerElement.style.pointerEvents = 'none'; // Evita interferência com eventos do mapa

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
