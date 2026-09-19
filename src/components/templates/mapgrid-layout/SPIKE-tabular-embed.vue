<!--
  SPIKE v9 — DESCARTAVEL.

  Os dois layouts do Directus, com o `setup()` de cada um chamado do nosso
  `setup()` em src/index.ts. Este componente nao cria wrapper nenhum: recebe os
  dois estados como prop e so desenha.

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike-layout">
    <div class="spike-bar" :data-report="embeddedReport">v9 · {{ embeddedReport }}</div>

    <div class="spike-split">
      <div class="spike-pane spike-pane--map">
        <component
          :is="embeddedMap?.component"
          v-if="embeddedMap?.component && hasState(embeddedMap)"
          v-bind="embeddedMap.state"
        />
        <p v-else>mapa sem estado</p>
      </div>

      <div class="spike-pane spike-pane--grid">
        <component
          :is="embeddedGrid?.component"
          v-if="embeddedGrid?.component && hasState(embeddedGrid)"
          v-bind="{ ...embeddedGrid.state, onRowClick: handleRowClick }"
        />
        <p v-else>grade sem estado</p>
      </div>
    </div>

    <p class="spike-status">
      grade: <b>{{ count(embeddedGrid, 'items') }}</b> itens ·
      <b>{{ count(embeddedGrid, 'tableHeaders') }}</b> colunas · mapa:
      <b>{{ count(embeddedMap, 'items') }}</b> itens · selecao:
      <b>{{ embeddedSelection?.length ?? 0 }}</b> [{{ (embeddedSelection ?? []).join(',') }}] ·
      sort: <b>{{ sortLabel }}</b> · clique: <b>{{ lastClick }}</b>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Embedded {
  id: string;
  report: string;
  state: Record<string, unknown>;
  component: unknown;
  optionsComponent: unknown;
}

const props = defineProps<{
  embeddedReport?: string;
  embeddedGrid?: Embedded;
  embeddedMap?: Embedded;
  embeddedSelection?: (string | number)[];
}>();

const hasState = (embedded?: Embedded): boolean =>
  Object.keys(embedded?.state ?? {}).length > 0;

const count = (embedded: Embedded | undefined, key: string): number => {
  const value = embedded?.state?.[key];
  return Array.isArray(value) ? value.length : 0;
};

const lastClick = ref('(nenhum)');

/** Sem isto o clique na linha navega para o item — a v2 ja tinha medido. */
const handleRowClick = (payload: unknown): void => {
  const item = (payload as { item?: { id?: string | number } } | null)?.item;
  lastClick.value = `item=${item?.id ?? '?'}`;
};

const sortLabel = computed(() => {
  const sort = props.embeddedGrid?.state?.tableSort as { by?: string; desc?: boolean } | undefined;
  return sort?.by ? `${sort.by}/${sort.desc ? 'desc' : 'asc'}` : '(nenhum)';
});
</script>

<style scoped>
.spike-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: var(--content-padding);
  padding-top: 0;
}
.spike-bar {
  flex: 0 0 auto;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 6px;
}
.spike-split {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 6px;
  overflow: hidden;
}
.spike-pane {
  min-height: 0;
  border: 2px dashed #708;
  position: relative;
}
.spike-pane--map {
  flex: 1 1 auto;
  overflow: hidden;
}
.spike-pane--grid {
  flex: 0 0 45%;
  overflow: auto;
}
.spike-status {
  flex: 0 0 auto;
  font-family: monospace;
  font-size: 12px;
}
</style>
