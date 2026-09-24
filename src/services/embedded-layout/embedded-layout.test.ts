import type { LayoutConfig, LayoutProps } from '@directus/types';
import { describe, expect, it, vi } from 'vitest';
import {
  CONTRATO_DOS_EMBUTIDOS,
  conferirContrato,
  embutirLayout,
  LAYOUTS_EMBUTIDOS,
  layoutEstaRegistrado,
  MARCA_DO_CONTRATO,
  SLOT_DE_OPCOES,
} from './embedded-layout';
import type { LayoutEmbutido } from './embedded-layout.types';

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
 * funcionar **sem avisar** — a grade fica vazia, o clique na linha volta a
 * navegar, o mapa não acha a geometria. Nada disso levanta exceção.
 *
 * Por isso o contrato mora no código, não num comentário: `conferirContrato`
 * compara o que o layout devolveu com o que a composição lê, e `embutirLayout`
 * grita no console o que faltou. A versão anterior deste bloco comparava uma
 * lista literal com ela mesma e não tinha como falhar por causa do Directus.
 *
 * Aqui se fixa a regra; quem mede contra o Directus de verdade é o
 * `tests/e2e/mapgrid-contrato.spec.ts`, que reprova se a mensagem aparecer.
 */
describe('o contrato com os layouts do Directus', () => {
  const estadoCompleto = (id: 'tabular' | 'map'): Record<string, unknown> =>
    Object.fromEntries(CONTRATO_DOS_EMBUTIDOS[id].map((chave) => [chave, null]));

  it('não acusa nada quando o layout devolve tudo que a composição lê', () => {
    const registro = [layoutFalso('tabular', () => estadoCompleto('tabular'))];
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const embutido = embutirLayout({
      id: 'tabular',
      registro,
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(conferirContrato(embutido as LayoutEmbutido)).toEqual([]);
    expect(erro).not.toHaveBeenCalled();
    erro.mockRestore();
  });

  it('acusa a chave que sumiu do que o layout devolveu', () => {
    const semCabecalhos = estadoCompleto('tabular');
    delete semCabecalhos.tableHeaders;
    delete semCabecalhos.onSortChange;

    const embutido = embutirLayout({
      id: 'tabular',
      registro: [layoutFalso('tabular', () => semCabecalhos)],
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(conferirContrato(embutido as LayoutEmbutido)).toEqual(['tableHeaders', 'onSortChange']);
  });

  it('o painel de opções é do contrato: sem ele a barra lateral fica sem a configuração deles', () => {
    const semPainel = {
      ...layoutFalso('map', () => estadoCompleto('map')),
      slots: {},
    } as LayoutConfig;

    const embutido = embutirLayout({
      id: 'map',
      registro: [semPainel],
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(conferirContrato(embutido as LayoutEmbutido)).toEqual([SLOT_DE_OPCOES]);
  });

  it('a chave que existe valendo `undefined` conta como entregue', () => {
    /*
     * `cameraOptions` nasce sem valor enquanto ninguém mexeu na câmera, e
     * `error` fica nulo sem erro. Exigir valor transformaria o contrato num
     * alarme falso a cada primeira visita; o que se exige é a chave.
     */
    const comVazios = { ...estadoCompleto('map'), cameraOptions: undefined };

    const embutido = embutirLayout({
      id: 'map',
      registro: [layoutFalso('map', () => comVazios)],
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(conferirContrato(embutido as LayoutEmbutido)).toEqual([]);
  });

  it('grita no console ao embutir, que é como a falta chega ao e2e', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    embutirLayout({
      id: 'map',
      registro: [layoutFalso('map', () => ({}))],
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(erro).toHaveBeenCalledTimes(1);
    const mensagem = String(erro.mock.calls[0]?.[0]);
    expect(mensagem).toContain(MARCA_DO_CONTRATO);
    expect(mensagem).toContain('map');
    expect(mensagem).toContain('geometryField');
    erro.mockRestore();
  });

  it('só cobra de quem tem contrato declarado, e não de um layout qualquer', () => {
    const embutido = embutirLayout({
      id: 'cards',
      registro: [layoutFalso('cards', () => ({}))],
      props: propsDeLayout(),
      emit: vi.fn(),
    });

    expect(conferirContrato(embutido as LayoutEmbutido)).toEqual([]);
  });

  it('os ids procurados no registro são os do app, e não inventados', () => {
    expect(LAYOUTS_EMBUTIDOS.grade).toBe('tabular');
    expect(LAYOUTS_EMBUTIDOS.mapa).toBe('map');
    expect(CONTRATO_DOS_EMBUTIDOS[LAYOUTS_EMBUTIDOS.grade]).toContain('tableHeaders');
    expect(CONTRATO_DOS_EMBUTIDOS[LAYOUTS_EMBUTIDOS.mapa]).toContain('geometryField');
  });

  it('reconhece um layout ausente do registro, que é como a falta aparece', () => {
    const registro = [layoutFalso('tabular', () => ({}))];

    expect(layoutEstaRegistrado(registro, LAYOUTS_EMBUTIDOS.grade)).toBe(true);
    expect(layoutEstaRegistrado(registro, LAYOUTS_EMBUTIDOS.mapa)).toBe(false);
  });
});
