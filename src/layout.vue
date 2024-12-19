<template>
  <div class="directus-table-layout">
    <!-- Carregando o Loader -->
    <div v-if="loading" class="loading-container">
      <loader />
    </div>

    <!-- Exibindo os dados -->
    <div v-else>
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
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

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
</script>

<style scoped>
.directus-table-layout {
  padding: 16px;
}

.table-header {
  display: flex;
  background-color: var(--color-background);
  border-bottom: 2px solid var(--color-border);
}

.table-header-item {
  flex: 1;
  padding: 10px;
  font-weight: bold;
  text-align: left;
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.table-row {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  width: 100%; /* Garantir que a linha ocupe 100% da largura */
  transition: background-color 0.3s; /* Suaviza a transição de fundo */
}

.table-row:hover {
  background-color: var(
    --theme--primary-background
  ); /* Cor de fundo ao passar o mouse */
}

.table-cell {
  flex: 1;
  padding: 8px;
  text-align: left;
  display: block; /* Garantir que a célula ocupe toda a área disponível */
}

.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
