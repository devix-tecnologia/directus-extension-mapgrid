<!--
  SPIKE — DESCARTAVEL. Nao faz parte da extensao.

  Pergunta: da para embutir o layout tabular do Directus aqui dentro, via
  `useLayout`, em vez de manter o nosso `v-table` + slots?

  O que este spike mede, no app de verdade (o Storybook nao serve: la o
  `@directus/extensions-sdk` e um mock nosso, entao nao existe layout tabular):

  1. o SDK que o Directus em execucao entrega exporta `useLayout`/`useExtensions`?
     (o bundle resolve o SDK como externo, e o e2e roda Directus 10.13.1, que e
     bem mais antigo que o SDK 16 contra o qual compilamos)
  2. quais layouts estao registrados
  3. o que o scoped slot do wrapper expoe como `layoutState`
  4. o layout tabular renderiza aqui dentro, e o clique na linha faz o que?

  Para desfazer: apagar este arquivo e `git checkout -- src/index.ts`.
-->
<template>
  <div class="spike">
    <h2>SPIKE — tabular embed</h2>
    <pre class="spike__report">{{ report }}</pre>

    <template v-if="wrapperComp">
      <component :is="wrapperComp" v-bind="wrapperProps">
        <template #default="{ layoutState }">
          <h3>layoutState ({{ Object.keys(layoutState).length }} chaves)</h3>
          <pre class="spike__report">{{ describe(layoutState) }}</pre>

          <h3>o layout tabular renderizado aqui dentro</h3>
          <div class="spike__grid">
            <component :is="tabularComp" v-if="tabularComp" v-bind="layoutState" />
            <p v-else>sem component do tabular</p>
          </div>
        </template>
      </component>
    </template>
  </div>
</template>

<script setup lang="ts">
import * as sdk from '@directus/extensions-sdk';
import type { Component } from 'vue';
import { computed, ref, shallowRef } from 'vue';

const props = defineProps<{ collection: string }>();

/* biome-disable — spike descartavel, o SDK em runtime pode nao ter estas chaves */
// biome-ignore lint/suspicious/noExplicitAny: spike
const anySdk = sdk as any;

const lines: string[] = [];
const wrapperComp = shallowRef<Component | null>(null);
const tabularComp = shallowRef<Component | null>(null);

lines.push(`exports do SDK: ${Object.keys(sdk).sort().join(', ')}`);
lines.push(`useExtensions: ${typeof anySdk.useExtensions}`);
lines.push(`useLayout: ${typeof anySdk.useLayout}`);

if (typeof anySdk.useExtensions === 'function') {
  try {
    const registered = anySdk.useExtensions().layouts?.value ?? [];
    lines.push(
      `layouts registrados: ${registered.map((l: { id: string }) => l.id).join(', ') || '(nenhum)'}`
    );
    const tabular = registered.find((l: { id: string }) => l.id === 'tabular');
    tabularComp.value = tabular?.component ?? null;
    lines.push(`component do tabular: ${tabular ? 'achado' : 'NAO achado'}`);
    lines.push(`slots do tabular: ${Object.keys(tabular?.slots ?? {}).join(', ') || '(nenhum)'}`);
  } catch (error) {
    lines.push(`useExtensions explodiu: ${String(error)}`);
  }
}

if (typeof anySdk.useLayout === 'function') {
  try {
    wrapperComp.value = anySdk.useLayout(ref('tabular')).layoutWrapper.value ?? null;
    lines.push(`layoutWrapper: ${wrapperComp.value ? 'obtido' : 'nulo'}`);
  } catch (error) {
    lines.push(`useLayout explodiu: ${String(error)}`);
  }
}

const report = lines.join('\n');

const wrapperProps = computed(() => ({
  collection: props.collection,
  selection: [],
  layoutOptions: {},
  layoutQuery: {},
  filter: null,
  search: null,
}));

const describe = (state: Record<string, unknown>): string =>
  Object.keys(state)
    .sort()
    .map((key) => {
      const value = state[key];
      const kind = Array.isArray(value) ? `array(${value.length})` : typeof value;
      return `${key}: ${kind}`;
    })
    .join('\n');
</script>

<style scoped>
.spike {
  padding: 16px;
  overflow: auto;
  height: 100%;
  font-family: monospace;
}
.spike__report {
  background: #f4f5f7;
  padding: 8px;
  white-space: pre-wrap;
  font-size: 12px;
}
.spike__grid {
  border: 2px dashed #c00;
  min-height: 300px;
}
</style>
