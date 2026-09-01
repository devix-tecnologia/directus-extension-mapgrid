import type { GeoItem } from '../../../services/geo/geo.types.js';
import type { Header } from '../../../services/table/table.types.js';

export interface TableComponentType {
  models: TableComponentModels;
  props: TableComponentProps;
  emits: TableComponentEmits;
}

export interface TableComponentModels {}

export interface TableComponentProps {
  items: GeoItem[];
  headers: Header[];
  collection: string;
  selectedItems: GeoItem[];
}

export interface TableComponentEmits {
  'focus-on-item': [item: GeoItem];
  'edit-item': [item: GeoItem];
  'update:selectedItems': [items: GeoItem[]];
}
