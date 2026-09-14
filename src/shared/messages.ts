/**
 * Os textos da extensão. Não vão em `directus_translations`: aquela tabela
 * depende de dado no banco do projeto, o que quebraria numa instalação nova.
 * `useI18n({ useScope: 'local', messages: MESSAGES })` herda o locale do app do
 * Directus e cai no en-US quando falta uma chave.
 */
export const MESSAGES = {
  'en-US': {
    loading: 'Loading…',
    noItems: 'No items found',
    noItemsHint: 'Nothing matches the current filter.',
    resetView: 'Reset view',
    editItem: 'Edit',
    actionsColumn: 'Actions',
    deleteSelected: 'Delete selected',
    deleteConfirmTitle: 'Delete {count} item(s)?',
    deleteConfirmBody: 'This action cannot be undone.',
    deleteFailed: 'Could not delete: {message}',
    cancel: 'Cancel',
    confirmDelete: 'Delete',
    optionPopup: 'Popup Pin Map',
    optionGeolocation: 'Geolocation',
    optionGeolocationPlaceholder: 'Select a geolocation field',
    optionMapCenter: 'Map Center',
    optionLongitude: 'Longitude',
    optionLatitude: 'Latitude',
    optionInitialZoom: 'Initial Zoom',
    optionZoomOnClick: 'Zoom on Table Click',
    optionZoomOnClickLabel: 'Zoom when clicking table items',
    optionColumns: 'Table Columns',
    optionColumnPlaceholder: 'Column {number}',
    optionNone: '---',
  },
  'pt-BR': {
    loading: 'Carregando…',
    noItems: 'Nenhum item encontrado',
    noItemsHint: 'Nada corresponde ao filtro atual.',
    resetView: 'Reenquadrar o mapa',
    editItem: 'Editar',
    actionsColumn: 'Ações',
    deleteSelected: 'Excluir selecionados',
    deleteConfirmTitle: 'Excluir {count} item(ns)?',
    deleteConfirmBody: 'Esta ação não pode ser desfeita.',
    deleteFailed: 'Não foi possível excluir: {message}',
    cancel: 'Cancelar',
    confirmDelete: 'Excluir',
    optionPopup: 'Popup do marcador',
    optionGeolocation: 'Geolocalização',
    optionGeolocationPlaceholder: 'Selecione um campo de geolocalização',
    optionMapCenter: 'Centro do mapa',
    optionLongitude: 'Longitude',
    optionLatitude: 'Latitude',
    optionInitialZoom: 'Zoom inicial',
    optionZoomOnClick: 'Zoom ao clicar na linha',
    optionZoomOnClickLabel: 'Aproximar ao clicar num item da grade',
    optionColumns: 'Colunas da grade',
    optionColumnPlaceholder: 'Coluna {number}',
    optionNone: '---',
  },
} as const;

/** Os locales que a extensão traduz. */
export type MessageLocale = keyof typeof MESSAGES;

/** As chaves de texto, derivadas do en-US para que faltar uma no pt-BR seja erro de tipo. */
export type MessageKey = keyof (typeof MESSAGES)['en-US'];
