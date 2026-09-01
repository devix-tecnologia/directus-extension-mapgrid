import { vi } from 'vitest';
import type { DeleteActionType } from './DeleteAction.types';

export const generateMockData = (): DeleteActionType => {
  const props: DeleteActionType['props'] = {
    selectedItems: [
      { id: 1, nome: 'Item 1' },
      { id: 2, nome: 'Item 2' },
    ],
    deleteSelectedItems: vi.fn().mockResolvedValue(undefined),
  };

  const models: DeleteActionType['models'] = {};

  const emits: DeleteActionType['emits'] = {};

  return {
    props,
    models,
    emits,
  };
};
