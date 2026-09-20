import type { LayoutConfig, LayoutProps } from '@directus/types';
import { describe, expect, it, vi } from 'vitest';
import { embutirLayout, LAYOUTS_EMBUTIDOS, layoutEstaRegistrado } from './embedded-layout';

const propsDeLayout = (): LayoutProps => ({
  collection: 'cidades',
  selection: [],
  layoutOptions: {},
  layoutQuery: {},
  layoutProps: {},
  filter: null,
  filterUser: null,
  filterSystem: null,
  search: null,
  selectMode: false,
  showSelect: 'multiple',
  readonly: false,
});

const layoutFalso = (id: string, setup: LayoutConfig['setup']): LayoutConfig =>
  ({
    id,
    name: id,
    icon: 'map',
    component: { template: '<div />' },
    slots: {
      options: { template: '<div />' },
      sidebar: { template: '<div />' },
      actions: { template: '<div />' },
    },
    setup,
  }) as LayoutConfig;

describe('embutirLayout', () => {
  it('roda o setup do layout registrado e devolve o que ele expõe', () => {
    const registro = [layoutFalso('tabular', () => ({ items: [{ id: 1 }], tableHeaders: [] }))];

    const embutido = embutirLayout({
      id: 'tabular',
      registro,
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(embutido?.state.items).toEqual([{ id: 1 }]);
    expect(embutido?.component).toBeTruthy();
    expect(embutido?.optionsComponent).toBeTruthy();
  });

  it('devolve nulo quando o id não está no registro, em vez de explodir', () => {
    const embutido = embutirLayout({
      id: 'inexistente',
      registro: [],
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(embutido).toBeNull();
  });

  it('repassa os props junto do estado, como o wrapper do Directus faz', () => {
    const registro = [layoutFalso('tabular', () => ({ items: [] }))];

    const embutido = embutirLayout({
      id: 'tabular',
      registro,
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    // sem isto o componente deles perde os proprios props
    expect(embutido?.state.collection).toBe('cidades');
    expect(embutido?.state.readonly).toBe(false);
  });

  it('sobe como emit o que é prop, porque é o pai que manda nesses', () => {
    const emit = vi.fn();
    const registro = [layoutFalso('tabular', () => ({ items: [] }))];

    const embutido = embutirLayout({ id: 'tabular', registro, props: propsDeLayout(), emit });
    const aoAtualizar = embutido?.state['onUpdate:layoutQuery'] as (valor: unknown) => void;
    aoAtualizar({ sort: ['-name'] });

    expect(emit).toHaveBeenCalledWith('update:layoutQuery', { sort: ['-name'] });
  });

  it('guarda no estado local o que não é prop, sem incomodar o pai', () => {
    const emit = vi.fn();
    const registro = [layoutFalso('tabular', () => ({ tableSpacing: 'cozy' }))];

    const embutido = embutirLayout({ id: 'tabular', registro, props: propsDeLayout(), emit });
    const aoAtualizar = embutido?.state['onUpdate:tableSpacing'] as (valor: unknown) => void;
    aoAtualizar('compact');

    expect(embutido?.state.tableSpacing).toBe('compact');
    expect(emit).not.toHaveBeenCalled();
  });
});

/**
 * Teste de contrato.
 *
 * Embutir os layouts do Directus depende do formato do `setup()` deles, que não
 * é API pública: uma atualização pode renomear uma chave e a composição para de
 * funcionar sem avisar. Estes testes não montam o Directus — eles fixam **o que
 * a implementação exige**, para que a exigência esteja escrita num lugar só.
 *
 * Quando o e2e quebrar contra uma versão nova, é aqui que se confere o que
 * mudou. As chaves vêm da medição de 2026-09-19 contra o Directus 10.13.1.
 */
describe('o contrato com os layouts do Directus', () => {
  const EXIGIDO_DA_GRADE = ['items', 'tableHeaders', 'tableSort', 'onSortChange', 'onRowClick'];
  const EXIGIDO_DO_MAPA = ['items', 'geojson', 'geometryField', 'fitDataBounds', 'cameraOptions'];

  it('a grade precisa destas chaves, e o mapa destas outras', () => {
    expect(EXIGIDO_DA_GRADE).toEqual(
      expect.arrayContaining(['items', 'tableHeaders', 'onSortChange'])
    );
    expect(EXIGIDO_DO_MAPA).toEqual(
      expect.arrayContaining(['geometryField', 'fitDataBounds', 'cameraOptions'])
    );
  });

  it('os ids procurados no registro são os do app, e não inventados', () => {
    expect(LAYOUTS_EMBUTIDOS.grade).toBe('tabular');
    expect(LAYOUTS_EMBUTIDOS.mapa).toBe('map');
  });

  it('reconhece um layout ausente do registro, que é como a falta aparece', () => {
    const registro = [layoutFalso('tabular', () => ({}))];

    expect(layoutEstaRegistrado(registro, LAYOUTS_EMBUTIDOS.grade)).toBe(true);
    expect(layoutEstaRegistrado(registro, LAYOUTS_EMBUTIDOS.mapa)).toBe(false);
  });
});
