import {
  DEFAULT_KIND_ID,
  fieldsFor,
  layoutOptionsFor,
  mappableKind,
} from '../../../mocks/mappable-mocks';
import type { MapgridOptionsType } from './MapgridOptions.types';

/** The options panel's props for one of the catalogue's collections. */
export const optionsPropsFor = (kindId: string = DEFAULT_KIND_ID): MapgridOptionsType['props'] => ({
  ...layoutOptionsFor(kindId),
  collection: mappableKind(kindId).id,
  fieldsInCollection: fieldsFor(kindId),
});

/** One sample payload per event, so the story documents what the panel emits. */
const sampleEmits: MapgridOptionsType['emits'] = {
  'update:fields': [['name', 'city']],
  'update:title': ['{{name}}'],
  'update:geolocation': ['location'],
  'update:mapCenterLng': [-47.9292],
  'update:mapCenterLat': [-15.7801],
  'update:mapZoom': [4],
  'update:coluna1': ['name'],
  'update:coluna2': ['city'],
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
