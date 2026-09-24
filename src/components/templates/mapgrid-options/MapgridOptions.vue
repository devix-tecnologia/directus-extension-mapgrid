<template>
  <!--
    A configuração é a dos próprios layouts do Directus. O painel deles monta
    aqui ligado ao MESMO estado que desenha a área, porque os dois nascem no
    `setup()` de `src/index.ts` — que o Directus entrega ao componente e ao
    painel. Criar wrapper próprio aqui daria estado separado e uma busca a mais.
  -->
  <!--
    As classes existem para o e2e ter por onde começar. Dentro de cada seção
    quem desenha é o painel do Directus, cujos rótulos mudam de idioma e de
    versão; procurar "Map" no texto da página acharia meia tela. Mesma escolha
    dos painéis da área, `.mapgrid-pane--map` e `.mapgrid-pane--grid`.
  -->
  <v-detail class="mapgrid-option mapgrid-option--map" icon="map" :label="t('optionMapSection')">
    <component :is="mapa?.optionsComponent" v-if="mapa?.optionsComponent" v-bind="mapa.state" />
    <p v-else class="sem-painel">{{ t('optionPanelMissing') }}</p>
  </v-detail>

  <v-detail
    class="mapgrid-option mapgrid-option--grid"
    icon="table_rows"
    :label="t('optionGridSection')"
  >
    <component :is="grade?.optionsComponent" v-if="grade?.optionsComponent" v-bind="grade.state" />
    <p v-else class="sem-painel">{{ t('optionPanelMissing') }}</p>
  </v-detail>

  <v-detail
    class="mapgrid-option mapgrid-option--zoom"
    icon="zoom_in"
    :label="t('optionZoomOnClick')"
  >
    <div class="field">
      <v-checkbox v-model="zoomOnClick" :label="t('optionZoomOnClickLabel')" />
    </div>
  </v-detail>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MESSAGES } from '../../../shared/messages';
import type { MapgridOptionsEmits, MapgridOptionsProps } from './MapgridOptions.types';

const props = defineProps<MapgridOptionsProps>();

const emit = defineEmits<MapgridOptionsEmits>();

const { t } = useI18n({ useScope: 'local', messages: MESSAGES });

const grade = computed(() => props.grade);
const mapa = computed(() => props.mapa);

const zoomOnClick = computed<boolean | undefined, unknown>({
  get: () => props.zoomOnClick,
  set: (value) => emit('update:zoomOnClick', Boolean(value)),
});
</script>

<style scoped>
.field {
  margin-top: var(--form-vertical-gap);
}

.sem-painel {
  color: var(--theme--foreground-subdued);
  font-style: italic;
}
</style>
