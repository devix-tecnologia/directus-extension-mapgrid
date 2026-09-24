/*
 * `MapComponent` e `TableComponent` saíram daqui porque os arquivos deles não
 * existem mais: a composição da task-010 desenha com os layouts do Directus. As
 * duas linhas continuavam exportando `./organisms/...`, que nenhum gate pegou —
 * o barril não tem importador, então nem o `vue-tsc` nem o build chegam nele.
 */
export { default as DeleteAction } from './atoms/delete-action/DeleteAction.vue';
export { default as MapgridLayout } from './templates/mapgrid-layout/MapgridLayout.vue';
export { default as MapgridOptions } from './templates/mapgrid-options/MapgridOptions.vue';
