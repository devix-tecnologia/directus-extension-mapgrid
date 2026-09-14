import { DEFAULT_KIND_ID, headersFor, mappableKind } from '../../../mocks/mappable-mocks';
import type { TableComponentType } from './TableComponent.types';

/** As props da grade para uma das coleções do catálogo. */
export const tablePropsFor = (kindId: string = DEFAULT_KIND_ID): TableComponentType['props'] => {
  const kind = mappableKind(kindId);

  return {
    items: kind.items,
    headers: headersFor(kindId),
    collection: kind.id,
    selectedItems: [],
    canEdit: true,
    canDelete: true,
  };
};

export const generateMockData = (): TableComponentType => {
  const props = tablePropsFor();
  const firstItem = props.items[0];

  return {
    props,
    models: {},
    emits: {
      'focus-on-item': firstItem ? [firstItem] : [{ id: 0 }],
      'edit-item': firstItem ? [firstItem] : [{ id: 0 }],
      'update:selectedItems': [props.items],
    },
  };
};
