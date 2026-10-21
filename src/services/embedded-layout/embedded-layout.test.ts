import type { LayoutConfig, LayoutProps } from '@directus/types';
import { describe, expect, it, vi } from 'vitest';
import {
  CONTRACT_MARKER,
  checkContract,
  EMBEDDED_CONTRACT,
  EMBEDDED_LAYOUTS,
  embedLayout,
  isLayoutRegistered,
  OPTIONS_SLOT,
} from './embedded-layout';
import type { EmbeddedLayout } from './embedded-layout.types';

const layoutProps = (): LayoutProps => ({
  collection: 'cities',
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

const fakeLayout = (id: string, setup: LayoutConfig['setup']): LayoutConfig =>
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

describe('embedLayout', () => {
  it('runs the registered layout setup and returns what it exposes', () => {
    const registry = [fakeLayout('tabular', () => ({ items: [{ id: 1 }], tableHeaders: [] }))];

    const embedded = embedLayout({
      id: 'tabular',
      registry,
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(embedded?.state.items).toEqual([{ id: 1 }]);
    expect(embedded?.component).toBeTruthy();
    expect(embedded?.optionsComponent).toBeTruthy();
  });

  it('returns null when the id is not in the registry, instead of throwing', () => {
    const embedded = embedLayout({
      id: 'missing',
      registry: [],
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(embedded).toBeNull();
  });

  it('hands the props back alongside the state, as the Directus wrapper does', () => {
    const registry = [fakeLayout('tabular', () => ({ items: [] }))];

    const embedded = embedLayout({
      id: 'tabular',
      registry,
      props: layoutProps(),
      emit: vi.fn(),
    });

    // without this their component loses its own props
    expect(embedded?.state.collection).toBe('cities');
    expect(embedded?.state.readonly).toBe(false);
  });

  it('sends up as an emit what is a prop, because the parent owns those', () => {
    const emit = vi.fn();
    const registry = [fakeLayout('tabular', () => ({ items: [] }))];

    const embedded = embedLayout({ id: 'tabular', registry, props: layoutProps(), emit });
    const onUpdate = embedded?.state['onUpdate:layoutQuery'] as (value: unknown) => void;
    onUpdate({ sort: ['-name'] });

    expect(emit).toHaveBeenCalledWith('update:layoutQuery', { sort: ['-name'] });
  });

  it('keeps in the local state what is not a prop, without bothering the parent', () => {
    const emit = vi.fn();
    const registry = [fakeLayout('tabular', () => ({ tableSpacing: 'cozy' }))];

    const embedded = embedLayout({ id: 'tabular', registry, props: layoutProps(), emit });
    const onUpdate = embedded?.state['onUpdate:tableSpacing'] as (value: unknown) => void;
    onUpdate('compact');

    expect(embedded?.state.tableSpacing).toBe('compact');
    expect(emit).not.toHaveBeenCalled();
  });
});

/**
 * Contract test.
 *
 * Embedding the Directus layouts depends on the shape of their `setup()`, which
 * is not public API: an update may rename a key and the composition stops
 * working **without warning** — the grid goes empty, the row click navigates
 * away again, the map cannot find the geometry. None of that throws.
 *
 * That is why the contract lives in the code, not in a comment: `checkContract`
 * compares what the layout returned against what the composition reads, and
 * `embedLayout` shouts in the console what was missing.
 *
 * The rule is pinned here; what measures it against a real Directus is
 * `tests/e2e/mapgrid-contract.spec.ts`, which fails if the message shows up.
 */
describe('the contract with the Directus layouts', () => {
  const fullState = (id: 'tabular' | 'map'): Record<string, unknown> =>
    Object.fromEntries(EMBEDDED_CONTRACT[id].map((key) => [key, null]));

  it('flags nothing when the layout returns everything the composition reads', () => {
    const registry = [fakeLayout('tabular', () => fullState('tabular'))];
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const embedded = embedLayout({
      id: 'tabular',
      registry,
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(checkContract(embedded as EmbeddedLayout)).toEqual([]);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('flags the key that vanished from what the layout returned', () => {
    const withoutHeaders = fullState('tabular');
    delete withoutHeaders.tableHeaders;
    delete withoutHeaders.onSortChange;

    const embedded = embedLayout({
      id: 'tabular',
      registry: [fakeLayout('tabular', () => withoutHeaders)],
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(checkContract(embedded as EmbeddedLayout)).toEqual(['tableHeaders', 'onSortChange']);
  });

  it('the options panel is part of the contract: without it the sidebar loses their configuration', () => {
    const withoutPanel = {
      ...fakeLayout('map', () => fullState('map')),
      slots: {},
    } as LayoutConfig;

    const embedded = embedLayout({
      id: 'map',
      registry: [withoutPanel],
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(checkContract(embedded as EmbeddedLayout)).toEqual([OPTIONS_SLOT]);
  });

  it('a key present but `undefined` counts as delivered', () => {
    /*
     * `cameraOptions` starts with no value until someone moves the camera, and
     * `error` stays null with no error. Demanding a value would turn the
     * contract into a false alarm on every first visit; what is demanded is the
     * key.
     */
    const withEmpties = { ...fullState('map'), cameraOptions: undefined };

    const embedded = embedLayout({
      id: 'map',
      registry: [fakeLayout('map', () => withEmpties)],
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(checkContract(embedded as EmbeddedLayout)).toEqual([]);
  });

  it('shouts in the console while embedding, which is how the gap reaches the e2e', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    embedLayout({
      id: 'map',
      registry: [fakeLayout('map', () => ({}))],
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(error).toHaveBeenCalledTimes(1);
    const message = String(error.mock.calls[0]?.[0]);
    expect(message).toContain(CONTRACT_MARKER);
    expect(message).toContain('map');
    expect(message).toContain('geometryField');
    error.mockRestore();
  });

  it('only charges those with a declared contract, and not just any layout', () => {
    const embedded = embedLayout({
      id: 'cards',
      registry: [fakeLayout('cards', () => ({}))],
      props: layoutProps(),
      emit: vi.fn(),
    });

    expect(checkContract(embedded as EmbeddedLayout)).toEqual([]);
  });

  it('the ids looked up in the registry are the app ones, not made up', () => {
    expect(EMBEDDED_LAYOUTS.grid).toBe('tabular');
    expect(EMBEDDED_LAYOUTS.map).toBe('map');
    expect(EMBEDDED_CONTRACT[EMBEDDED_LAYOUTS.grid]).toContain('tableHeaders');
    expect(EMBEDDED_CONTRACT[EMBEDDED_LAYOUTS.map]).toContain('geometryField');
  });

  it('recognises a layout missing from the registry, which is how the gap shows up', () => {
    const registry = [fakeLayout('tabular', () => ({}))];

    expect(isLayoutRegistered(registry, EMBEDDED_LAYOUTS.grid)).toBe(true);
    expect(isLayoutRegistered(registry, EMBEDDED_LAYOUTS.map)).toBe(false);
  });

  it('the map contract covers what the centerer reads from and writes to its state', () => {
    const map: readonly string[] = EMBEDDED_CONTRACT[EMBEDDED_LAYOUTS.map];
    for (const key of [
      'geojson',
      'geojsonBounds',
      'geometryField',
      'featureId',
      'isGeometryFieldNative',
      'cameraOptions',
      'fitDataBounds',
    ]) {
      expect(map, key).toContain(key);
    }
  });
});
