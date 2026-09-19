<!--
  SPIKE — DESCARTAVEL. Nao faz parte da extensao.

  v7 — a virada: em vez de "grade deles + mapa nosso", compor **os dois layouts
  do Directus**. Ele registra um layout `map` alem do `tabular`, e a extensao
  passaria a ser a composicao dos dois, nao a reimplementacao de nenhum.

  Quatro perguntas:
    1. o layout `map` deles monta aqui dentro, ao lado do `tabular`?
    2. `selection` — um dos tres props que sobem como emit — serve de sincronia
       entre os dois? clicar na linha deveria acender o marcador, e vice-versa
    3. quantas consultas ao backend, agora que sao dois layouts de verdade?
    4. o `layoutQuery` compartilhado aguenta os dois escrevendo nele?

  O historico: v5 provou consulta unica com `layoutQuery` de mao dupla; v2
  provou o `onRowClick` trocado. Aqui nada disso e usado — a ideia e justamente
  nao interceptar nada, e deixar cada layout ser o que ele e.

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike-layout">
    <div class="spike-bar">
      <span>v7 — dois layouts do Directus compostos</span>
      <span>map: <b>{{ mapComp ? 'ok' : 'ausente' }}</b></span>
      <span>tabular: <b>{{ tabularComp ? 'ok' : 'ausente' }}</b></span>
    </div>

    <div class="spike-split">
      <!-- o layout `map` do Directus -->
      <div class="spike-pane spike-pane--map">
        <component :is="mapWrapper" v-if="mapWrapper" v-bind="mapProps" v-on="wrapperEvents">
          <template #default="{ layoutState }">
            <span class="spike-keys" :data-map-keys="Object.keys(layoutState).sort().join(',')" />
            <component :is="mapComp" v-if="mapComp" v-bind="layoutState" />
          </template>
        </component>
      </div>

      <!-- o layout `tabular` do Directus -->
      <div class="spike-pane spike-pane--grid">
        <component
          :is="tabularWrapper"
          v-if="tabularWrapper"
          v-bind="wrapperProps"
          v-on="wrapperEvents"
        >
          <template #default="{ layoutState }">
            <component :is="tabularComp" v-if="tabularComp" v-bind="layoutState" />
          </template>
        </component>
      </div>
    </div>

    <p class="spike-status">
      selecao: <b>{{ selection.length }}</b> [{{ selection.join(',') }}] · emits de selection:
      <b>{{ selectionEmits }}</b> · emits de layoutQuery: <b>{{ queryEmits }}</b> · sort:
      <b>{{ (liveQuery.sort as string[])?.join(',') }}</b>
    </p>
  </div>
</template>

<script setup lang="ts">
import * as sdk from '@directus/extensions-sdk';
import type { Component } from 'vue';
import { computed, ref, shallowRef } from 'vue';

const props = defineProps<{ collection: string; geolocation?: string }>();

// biome-ignore lint/suspicious/noExplicitAny: spike descartavel
const anySdk = sdk as any;

const mapComp = shallowRef<Component | null>(null);
const tabularComp = shallowRef<Component | null>(null);

if (typeof anySdk.useExtensions === 'function') {
  const registered = anySdk.useExtensions().layouts?.value ?? [];
  const find = (id: string) => registered.find((l: { id: string }) => l.id === id)?.component ?? null;
  mapComp.value = find('map');
  tabularComp.value = find('tabular');
}

const useWrapper = (id: string) =>
  typeof anySdk.useLayout === 'function' ? anySdk.useLayout(ref(id)).layoutWrapper : null;

const mapWrapper = useWrapper('map');
const tabularWrapper = useWrapper('tabular');

/*
 * Estado compartilhado. `selection` e `layoutQuery` sao dois dos tres props que
 * sobem como emit, entao os dois layouts podem escrever neles — e e isso que se
 * quer medir: se a selecao feita num aparece no outro.
 */
const selection = ref<(string | number)[]>([]);
const selectionEmits = ref(0);
const queryEmits = ref(0);

const liveQuery = ref<Record<string, unknown>>({
  fields: [...new Set(['name', 'status', props.geolocation].filter(Boolean))],
  sort: ['name'],
  limit: 25,
  page: 1,
});

const wrapperProps = computed(() => ({
  collection: props.collection,
  selection: selection.value,
  layoutOptions: {},
  layoutQuery: liveQuery.value,
  filter: null,
  search: null,
}));

/*
 * O layout `map` le o campo de geometria do `layoutOptions` DELE, nao do
 * `layoutQuery`. Passando vazio, ele pedia `fields[]=id` e desenhava um mapa
 * sem marcador nenhum — a configuracao dele e que diz onde estao os pontos.
 *
 * O nome da chave nao esta documentado para extensao, entao o spike tenta as
 * que fazem sentido e despeja as chaves do estado no DOM, para conferir qual
 * pegou.
 */
const mapProps = computed(() => ({
  ...wrapperProps.value,
  layoutOptions: {
    geometryField: props.geolocation,
    geometryFormat: 'native',
    clusterData: true,
  },
}));

const wrapperEvents = {
  'update:selection': (next: (string | number)[]) => {
    selectionEmits.value += 1;
    selection.value = next;
  },
  'update:layoutQuery': (next: Record<string, unknown>) => {
    queryEmits.value += 1;
    liveQuery.value = next;
  },
};
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
  gap: 6px;
  overflow: hidden;
}
.spike-pane {
  min-height: 0;
  overflow: hidden;
  border: 2px dashed #00a;
  position: relative;
}
.spike-pane--map {
  flex: 1 1 auto;
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
