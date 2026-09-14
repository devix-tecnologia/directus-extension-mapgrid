import type { GeoItem } from '../../../contract/index';

export interface DeleteActionType {
  models: DeleteActionModels;
  props: DeleteActionProps;
  emits: DeleteActionEmits;
}

export type DeleteActionModels = Record<string, never>;

export interface DeleteActionProps {
  selectedItems: GeoItem[];
  deleteSelectedItems: () => Promise<void>;
}

export type DeleteActionEmits = Record<string, never>;
