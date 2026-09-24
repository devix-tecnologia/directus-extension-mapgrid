<template>
  <div class="mapgrid-layout">
    <v-info v-if="faltaLayout" icon="warning" :title="t('missingLayout')" center>
      {{ t('missingLayoutHint') }}
    </v-info>

    <div v-else class="mapgrid-container">
      <div class="mapgrid-pane mapgrid-pane--map">
        <component :is="mapa?.component" v-if="mapa?.component" v-bind="propsDoMapa" />
        <MapToolbar class="mapgrid-toolbar" @reset="reenquadrar" />
      </div>

      <div class="mapgrid-pane mapgrid-pane--grid">
        <component :is="grade?.component" v-if="grade?.component" v-bind="propsDaGrade" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { GeoItem } from '../../../contract/index';
import type { LayoutEmbutido } from '../../../services/embedded-layout/index';
import { MESSAGES } from '../../../shared/messages';
import MapToolbar from '../../molecules/map-toolbar/MapToolbar.vue';

const props = defineProps<{
  grade?: LayoutEmbutido | null;
  mapa?: LayoutEmbutido | null;
  zoomOnClick?: boolean;
}>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

/** Zoom aplicado ao enquadrar um item pelo clique na linha. */
const ZOOM_AO_CLICAR = 14;

const faltaLayout = computed(() => !props.grade?.component || !props.mapa?.component);

const doMapa = <T>(chave: string): T | undefined => props.mapa?.state[chave] as T | undefined;

/**
 * Reenquadrar é do mapa deles: `fitDataBounds` reajusta ao conjunto atual. Sem
 * isso a barra do mapa teria de falar com uma instância do MapLibre que não é
 * nossa.
 */
const reenquadrar = (): void => {
  doMapa<() => void>('fitDataBounds')?.();
};

/**
 * O clique na linha é nosso, e precisa ser: sem trocar o `onRowClick`, a grade
 * do Directus navega para a tela do item, que é o oposto de sincronizar com o
 * mapa — a razão de existir desta extensão.
 *
 * **Enquadrar, porém, ainda não acontece na tela.** Medido em 2026-09-24: esta
 * escrita chega a `layoutOptions.map.cameraOptions` e ao preset, com `center` e
 * `zoom` certos, e o mapa desenhado não se mexe. O layout de mapa deles lê
 * `cameraOptions` ao montar — uma câmera semeada no preset é honrada, e é assim
 * que o e2e acha um marcador — e ignora a troca depois disso. As duas formas de
 * `center` foram medidas, o par cru e o `{ lng, lat }` que eles mesmos gravam:
 * nenhuma move o mapa vivo. O efeito só aparece na visita seguinte.
 *
 * Mover a câmera de verdade exige alcançar a instância do MapLibre deles, e
 * isso é a mesma decisão reservada do `MapToolbar` e do zoom ao clicar. O e2e
 * que prova o enquadramento está escrito e parado em `test.fixme`.
 */
const enquadrarItem = (payload: unknown): void => {
  const item = (payload as { item?: GeoItem } | null)?.item;
  const coordenadas = coordenadasDe(item);
  if (!coordenadas) return;

  const camera = doMapa<Record<string, unknown>>('cameraOptions') ?? {};
  const atualizar = doMapa<(valor: unknown) => void>('onUpdate:cameraOptions');

  atualizar?.({
    ...camera,
    center: coordenadas,
    zoom: props.zoomOnClick ? ZOOM_AO_CLICAR : (camera.zoom ?? ZOOM_AO_CLICAR),
  });
};

/**
 * O clique no ponto é o caminho inverso, e também precisa ser nosso: o
 * `handleClick` do layout de mapa faz `router.push` para a tela do item quando
 * não está em modo de seleção, então clicar num marcador *saía do MapGrid*.
 *
 * O que entra no lugar é a outra metade deles: marcar o item na `selection`,
 * que é estado compartilhado pelos dois embutidos, e é assim que a linha
 * correspondente acende na grade sem o template tocar no DOM dela. Acrescenta e
 * remove como a caixa de marcação da grade, para marcador e caixa serem a mesma
 * linguagem.
 *
 * Herda uma ressalva: a `selection` também arma as ações em lote, então marcar
 * pelo mapa habilita apagar. Quem decide se "registro atual" ganha destaque
 * próprio é a task-006.
 */
const selecionarItem = (payload: unknown): void => {
  const id = (payload as { id?: string | number } | null | undefined)?.id;
  if (id === undefined || id === null) return;

  const selecionados = doMapa<(string | number)[]>('selection') ?? [];
  const proxima = selecionados.includes(id)
    ? selecionados.filter((selecionado) => selecionado !== id)
    : [...selecionados, id];

  doMapa<(valor: unknown) => void>('onUpdate:selection')?.(proxima);
};

const coordenadasDe = (item?: GeoItem): [number, number] | null => {
  const campo = doMapa<string>('geometryField');
  const geometria = campo ? (item?.[campo] as { coordinates?: unknown } | undefined) : undefined;
  const coordenadas = geometria?.coordinates;

  return Array.isArray(coordenadas) && coordenadas.length >= 2
    ? [Number(coordenadas[0]), Number(coordenadas[1])]
    : null;
};

const propsDaGrade = computed(() => ({
  ...(props.grade?.state ?? {}),
  onRowClick: enquadrarItem,
}));

const propsDoMapa = computed(() => ({
  ...(props.mapa?.state ?? {}),
  handleClick: selecionarItem,
}));
</script>

<style scoped>
.mapgrid-layout {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  position: relative;
  padding: var(--content-padding);
  padding-top: 0;
  padding-bottom: var(--content-padding-bottom);
}

.mapgrid-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--content-padding);
  background: var(--theme--background);
  border: 1px solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  overflow: hidden;
}

.mapgrid-pane {
  min-height: 0;
  position: relative;
}

.mapgrid-pane--map {
  flex: 1 1 auto;
  display: flex;
  overflow: hidden;
}

.mapgrid-pane--grid {
  flex: 0 0 40%;
  overflow: auto;
}

.mapgrid-toolbar {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  z-index: 2;
}

/*
 * Os layouts do Directus assumem a página inteira em detalhes que não estão na
 * API, e compor exige desfazer cada um. Os três abaixo foram medidos no DOM,
 * não deduzidos:
 *
 * - `.layout-tabular` traz `margin: 32px 0 132px`, a folga de cabeçalho e
 *   paginação de uma página inteira — em meia tela vira buraco;
 * - o cabeçalho da grade é `sticky` com deslocamento da altura do cabeçalho do
 *   app: o `tr.fixed` caía 60px abaixo do topo da tabela, com as primeiras
 *   linhas correndo por baixo dele. Aqui quem rola é o painel;
 * - `.layout-map` nasce `flex: 0 1 auto` e não estica, deixando faixa branca.
 */
.mapgrid-pane--grid :deep(.layout-tabular) {
  margin-block: 0;
}

.mapgrid-pane--grid :deep(thead.table-header tr.fixed) {
  top: 0;
}

.mapgrid-pane--map :deep(.layout-map) {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}
</style>
