import type { GeoItem } from '../../../services/geo/geo.types.js';

export interface DeleteActionType {
  models: DeleteActionModels;
  props: DeleteActionProps;
  emits: DeleteActionEmits;
}

export interface DeleteActionModels {}

export interface DeleteActionProps {
  selectedItems: GeoItem[];
  deleteSelectedItems: () => Promise<void>;
}

export interface DeleteActionEmits {}
