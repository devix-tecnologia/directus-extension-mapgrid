<template>
  <div class="directus-table-layout">
    <!-- Carregando o Loader -->
    <div v-if="loading" class="loading-container">
      <loader />
    </div>

    <!-- Dividindo a tela em mapa e lista -->
    <div v-else class="layout-container">
      <!-- Mapa de Coordenadas -->
      <div class="map-container" ref="mapContainer"></div>

      <!-- Exibindo os dados (Lista) -->
      <div class="table-container">
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
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import L from "leaflet"; // Importando o Leaflet
import "leaflet/dist/leaflet.css";

// Propriedades recebidas do componente pai
const props = defineProps({
  items: Array,
  loading: Boolean,
  fields: Array,
  collection: {
    type: String,
    required: true,
  },
});

// Router para navegação
const router = useRouter();

// Computando os cabeçalhos
const headers = computed(() =>
  props.fields.map((field) => ({
    text: field, // Nome da coluna
    value: field, // Chave usada no objeto `item`
  }))
);

// Referência do mapa
const mapContainer = ref(null);
let map = null;
let markers = []; // Armazena os marcadores para referência posterior

// Inicializar o mapa e adicionar os marcadores
onMounted(() => {
  const mapElement = mapContainer.value;
  if (mapElement) {
    mapElement.style.height = "50vh"; // Garantir que o mapa tenha 50% da altura da tela
    map = L.map(mapElement).setView(
      [-19.629323252716748, -40.32739397081107], // Coordenadas iniciais (ajuste conforme necessário)
      7
    );

    // Adicionando o tile layer (os "blocos" do mapa)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Criando o ícone personalizado
    const customIcon = L.divIcon({
      className: "custom-icon",
      html: '<div style="width: 30px; height: 30px; background-color: blue; border-radius: 50%; border: 2px solid white;"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });

    // L.marker([51.5, -0.09], { icon: customIcon })
    //   .addTo(map)
    //   .bindPopup("Testando marcador simples")
    //   .openPopup();

    // Iterando sobre os itens e adicionando marcadores no mapa
    props.items.forEach((item) => {
      const coordinates = item.mapa?.coordinates;
      if (
        coordinates &&
        Array.isArray(coordinates) &&
        coordinates.length === 2
      ) {
        const [longitude, latitude] = coordinates;
        const marker = L.marker([latitude, longitude], {
          icon: customIcon,
        })
          .addTo(map)
          .bindPopup(`<b>${item.nome}</b>`);
        markers.push({ id: item.id, marker });
      } else {
        console.warn(
          `Coordenadas inválidas para o item ${item.id}:`,
          coordinates
        );
      }
    });

    // Forçar o ajuste da visualização do mapa após os marcadores serem adicionados
    map.invalidateSize();
  }
});

// Centralizar o mapa ao clicar no item
const focusOnItem = (item) => {
  const coordinates = item.mapa?.coordinates;
  if (coordinates && map) {
    const [longitude, latitude] = coordinates;
    map.setView([latitude, longitude], 15);
    const marker = markers.find((m) => m.id === item.id)?.marker;
    if (marker) {
      marker.openPopup();
    }
  }
};
</script>

<style scoped>
/* Layout geral */
.directus-table-layout {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px); /* Subtrai o cabeçalho */
}

.layout-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.map-container {
  width: 100%;
}

.table-container {
  height: 50%;
  overflow-y: auto;
  padding: 16px;
}

/* Estilo do cabeçalho */
.table-header {
  display: flex;
  background-color: var(--color-background);
  border-bottom: 2px solid var(--background-normal-alt);
  margin-bottom: 8px;
}

.table-header-item {
  flex: 1;
  padding: 10px;
  font-weight: bold;
  text-align: left;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

/* Estilo das linhas da tabela */
.table-row {
  display: flex;
  border: 1px solid var(--background-normal-alt);
  border-radius: 8px; /* Bordas arredondadas */
  margin-bottom: 8px; /* Espaçamento entre as linhas */
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* Sombra leve */
  transition: background-color 0.3s, box-shadow 0.3s; /* Suavização */
}

.table-row:hover {
  background-color: var(--theme--primary-background);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); /* Realce na sombra */
}

/* Estilo de cada célula */
.table-cell {
  flex: 1;
  padding: 10px;
  text-align: left;
}

.custom-icon .circle-icon {
  width: 30px; /* Largura do círculo */
  height: 30px; /* Altura do círculo */
  background-color: blue; /* Cor de fundo azul */
  border-radius: 50%; /* Faz o fundo ser um círculo */
  border: 2px solid white; /* Adiciona uma borda branca (opcional) */
}
</style>
