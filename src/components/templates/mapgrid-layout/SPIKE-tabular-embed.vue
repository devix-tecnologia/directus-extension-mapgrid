<!--
  SPIKE v8 — DESCARTAVEL.

  O estado do layout embutido agora nasce no `setup()` de `src/index.ts`, e
  chega aqui como prop. Este componente so desenha; nao cria wrapper nenhum.

  Se o painel de opcoes receber o mesmo estado (ver MapgridOptions.vue), o
  problema de "painel e layout sao irmaos" esta resolvido por construcao.

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike-layout">
    <div class="spike-bar">
      <span>v8 — setup() deles chamado do nosso</span>
      <span :data-report="embeddedReport">{{ embeddedReport }}</span>
    </div>

    <div class="spike-split">
      <div class="spike-pane spike-pane--grid">
        <component
          :is="embeddedComponent"
          v-if="embeddedComponent && hasState"
          v-bind="embeddedState"
        />
        <p v-else>sem componente ou sem estado</p>
      </div>
    </div>

    <p class="spike-status">
      itens: <b>{{ itemCount }}</b> · colunas: <b>{{ headerCount }}</b> · selecao:
      <b>{{ embeddedSelection?.length ?? 0 }}</b> · sort: <b>{{ sortLabel }}</b>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  embeddedReport?: string;
  embeddedState?: Record<string, unknown>;
  embeddedComponent?: unknown;
  embeddedSelection?: (string | number)[];
}>();

const hasState = computed(() => Object.keys(props.embeddedState ?? {}).length > 0);

const itemCount = computed(() => {
  const items = props.embeddedState?.items;
  return Array.isArray(items) ? items.length : 0;
});

const headerCount = computed(() => {
  const headers = props.embeddedState?.tableHeaders;
  return Array.isArray(headers) ? headers.length : 0;
});

const sortLabel = computed(() => {
  const sort = props.embeddedState?.tableSort as { by?: string; desc?: boolean } | undefined;
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
  display: flex;
  gap: 12px;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 6px;
}
.spike-split {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.spike-pane {
  min-height: 0;
  overflow: auto;
  border: 2px dashed #708;
}
.spike-pane--grid {
  flex: 1 1 auto;
}
.spike-status {
  flex: 0 0 auto;
  font-family: monospace;
  font-size: 12px;
}
</style>
