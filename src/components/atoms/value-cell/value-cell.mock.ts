import type { ValueCellType } from './value-cell.types';

export const generateMockData = (): ValueCellType => {
  const props: ValueCellType['props'] = {
    value: 'Exemplo de valor',
  };

  const models: ValueCellType['models'] = {};

  const emits: ValueCellType['emits'] = {};

  return {
    props,
    models,
    emits,
  };
};
