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

export const generateMockData = (): MapgridOptionsType => ({
  props: optionsPropsFor(),
  models: {},
  emits: {} as MapgridOptionsType['emits'],
});
