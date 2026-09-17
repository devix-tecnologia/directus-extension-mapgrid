/**
 * The extension's own strings. They do not live in `directus_translations`:
 * that table depends on data in the project's database, which would break on a
 * fresh install. `useI18n({ useScope: 'local', messages: MESSAGES })` inherits
 * the Directus app locale and falls back to en-US when a key is missing.
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
    optionColumnsAdd: 'Add field',
    hideField: 'Hide field',
    sortAscending: 'Sort ascending',
    sortDescending: 'Sort descending',
    optionColumnsEmpty: 'No fields chosen yet — the grid shows only the actions column.',
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
    optionColumnsAdd: 'Adicionar campo',
    hideField: 'Ocultar campo',
    sortAscending: 'Ordem crescente',
    sortDescending: 'Ordem decrescente',
    optionColumnsEmpty: 'Nenhum campo escolhido ainda — a grade mostra só a coluna de ações.',
    optionNone: '---',
  },
} as const;

/** The locales the extension translates. */
export type MessageLocale = keyof typeof MESSAGES;

/** The message keys, derived from en-US so a missing pt-BR key is a type error. */
export type MessageKey = keyof (typeof MESSAGES)['en-US'];
