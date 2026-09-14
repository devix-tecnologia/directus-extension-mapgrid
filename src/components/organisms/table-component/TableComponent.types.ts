import type { GeoItem } from '../../../contract/index';
import type { Header } from '../../../services/table/table.types';

export interface TableComponentType {
  models: TableComponentModels;
  props: TableComponentProps;
  emits: TableComponentEmits;
}

export type TableComponentModels = Record<string, never>;

export interface TableComponentProps {
  items: GeoItem[];
  headers: Header[];
  collection: string;
  selectedItems: GeoItem[];
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface TableComponentEmits {
  'focus-on-item': [item: GeoItem];
  'edit-item': [item: GeoItem];
  'update:selectedItems': [items: GeoItem[]];
}
