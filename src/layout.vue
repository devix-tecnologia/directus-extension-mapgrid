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
          @click="goToItem(item.id)"
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

// Função de navegação
const goToItem = (id) => {
  router.push(`/content/${props.collection}/${id}`);
};

// Referência do mapa
const mapContainer = ref(null);
let map = null;

// Inicializar o mapa e adicionar os marcadores
onMounted(() => {
  // Garantir que a altura do contêiner seja 100% antes de inicializar o mapa
  const mapElement = mapContainer.value;
  if (mapElement) {
    mapElement.style.height = "50vh"; // Garantir que o mapa tenha 50% da altura da tela

    // Criando o mapa
    map = L.map(mapElement).setView(
      [-20.329323252716748, -40.32739397081107],
      13
    );

    // Adicionando o tile layer do OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Adicionando marcadores para cada item
    props.items.forEach((item) => {
      const coordinates = item.mapa?.coordinates;
      if (coordinates) {
        L.marker([coordinates[1], coordinates[0]])
          .addTo(map)
          .bindPopup(`<b>${item.nome}</b>`);
      }
    });
  }
});
</script>

<style scoped>
/* Estilo geral para o layout */
.directus-table-layout {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Container principal para o mapa e a lista */
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Mapa ocupa metade da tela */
.map-container {
  width: 100%;
}

/* Container para a tabela */
.table-container {
  height: 50%;
  overflow-y: auto;
  padding: 16px;
}

/* Estilo do cabeçalho da tabela */
.table-header {
  display: flex;
  background-color: var(--color-background);
  border-bottom: 2px solid var(--color-border);
}

/* Estilo de cada item no cabeçalho */
.table-header-item {
  flex: 1;
  padding: 10px;
  font-weight: bold;
  text-align: left;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

/* Estilo para as linhas da tabela */
.table-row {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  width: 100%; /* Garantir que a linha ocupe 100% da largura */
  transition: background-color 0.3s; /* Suaviza a transição de fundo */
}

/* Cor de fundo ao passar o mouse na linha */
.table-row:hover {
  background-color: var(--color-background-alt);
}

/* Estilo de cada célula da tabela */
.table-cell {
  flex: 1;
  padding: 8px;
  text-align: left;
}

/* Centralizando o loader */
.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
