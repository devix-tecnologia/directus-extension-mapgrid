import {
  DEFAULT_KIND_ID,
  fieldsFor,
  layoutOptionsFor,
  mappableKind,
} from '../../../mocks/mappable-mocks.js';
import type { MapgridOptionsType } from './MapgridOptions.types';

/** As props do painel de opções para uma das coleções do catálogo. */
export const optionsPropsFor = (kindId: string = DEFAULT_KIND_ID): MapgridOptionsType['props'] => ({
  ...layoutOptionsFor(kindId),
  collection: mappableKind(kindId).id,
  fieldsInCollection: fieldsFor(kindId),
});

/** Uma carga de exemplo por evento, para a story documentar o que o painel emite. */
const sampleEmits: MapgridOptionsType['emits'] = {
  'update:title': ['{{nome}}'],
  'update:geolocation': ['localizacao'],
  'update:mapCenterLng': [-47.9292],
  'update:mapCenterLat': [-15.7801],
  'update:mapZoom': [4],
  'update:coluna1': ['nome'],
  'update:coluna2': ['cidade'],
  'update:coluna3': [null],
  'update:coluna4': [null],
  'update:coluna5': [null],
  'update:zoomOnClick': [true],
};

export const generateMockData = (): MapgridOptionsType => ({
  props: optionsPropsFor(),
  models: {},
  emits: sampleEmits,
});
