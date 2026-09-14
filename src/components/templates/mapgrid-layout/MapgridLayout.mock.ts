import { DEFAULT_KIND_ID, layoutOptionsFor, mappableKind } from '../../../mocks/mappable-mocks';
import type { MapgridLayoutType } from './MapgridLayout.types';

/** The whole layout's props for one of the catalogue's collections. */
export const layoutPropsFor = (kindId: string = DEFAULT_KIND_ID): MapgridLayoutType['props'] => {
  const kind = mappableKind(kindId);

  return {
    ...layoutOptionsFor(kindId),
    items: kind.items,
    loading: false,
    collection: kind.id,
    selectedItems: [],
    canEdit: true,
    canDelete: true,
  };
};

export const generateMockData = (): MapgridLayoutType => {
  const props = layoutPropsFor();
  const firstItem = props.items[0];

  return {
    props,
    models: {},
    emits: {
      'update:selectedItems': [props.items],
      'edit-item': firstItem ? [firstItem] : [{ id: 0 }],
    },
  };
};
