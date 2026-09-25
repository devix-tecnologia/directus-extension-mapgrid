/**
 * The two `layoutOptions` sections, writing to the same preset.
 *
 * The map keeps its configuration in `layoutOptions.map` and the grid in
 * `layoutOptions.tabular`, precisely so that one does not overwrite the other.
 * What this file measures is whether the separation survives the way back: what
 * publishes an option is an `emit`, and the value only reaches the layout again
 * through the **prop**, which in Vue only changes when the parent re-renders —
 * on the next tick, not right away.
 *
 * That is why the fake Directus here delays the prop on purpose. A test double
 * that returned the value right away would hide exactly the window where the
 * two sections get lost, and the test would be born green without proving
 * anything.
 */
import type { LayoutConfig, LayoutProps } from '@directus/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { EMBEDDED_CONTRACT } from './services/embedded-layout/index';

const registry = vi.hoisted(() => ({ layouts: [] as unknown[] }));

/**
 * The Directus SDK, reduced to what `setup()` uses. `useSync` is the real one —
 * it reads from the prop and writes through `emit` — because that is where the
 * window this file measures comes from.
 */
vi.mock('@directus/extensions-sdk', async () => {
  const { computed: vueComputed, ref: vueRef } = await import('vue');

  return {
    defineLayout: (config: unknown) => config,
    useSync: (
      props: Record<string, unknown>,
      key: string,
      emit: (event: string, value: unknown) => void
    ) =>
      vueComputed({
        get: () => props[key],
        set: (value: unknown) => emit(`update:${key}`, value),
      }),
    useApi: () => ({ delete: () => Promise.resolve() }),
    useCollection: () => ({ fields: vueRef([]), primaryKeyField: vueRef(null) }),
    useExtensions: () => ({ layouts: vueComputed(() => registry.layouts) }),
  };
});

const emptyComponent = defineComponent({
  name: 'EmptyComponent',
  setup: () => () => h('div'),
});

/**
 * A fake Directus layout, written the way theirs are: the view options are
 * computeds that read and write the whole `layoutOptions`, one key at a time
 * (`{ ...layoutOptions.value, [key]: value }`). It is that shape — and not a
 * direct `emit` — that makes the previous option depend on the prop having come
 * back already.
 */
function directusLayout(
  id: 'tabular' | 'map',
  viewOptions: readonly string[],
  queryKeys: readonly string[] = []
): LayoutConfig {
  return {
    id,
    name: id,
    icon: 'box',
    component: emptyComponent,
    slots: { options: emptyComponent, sidebar: emptyComponent, actions: emptyComponent },
    setup(props: Record<string, unknown>, { emit }: { emit: (e: string, v: unknown) => void }) {
      const layoutOptions = computed<Record<string, unknown>>({
        get: () => (props.layoutOptions as Record<string, unknown>) ?? {},
        set: (value) => emit('update:layoutOptions', value),
      });

      const state: Record<string, unknown> = {};
      for (const key of EMBEDDED_CONTRACT[id]) state[key] = ref(undefined);
      state.items = ref([]);

      for (const key of viewOptions) {
        state[key] = computed({
          get: () => layoutOptions.value[key],
          set: (value: unknown) => {
            layoutOptions.value = { ...layoutOptions.value, [key]: value };
          },
        });
      }

      /* The query belongs to both, and they write it the same way: key by key. */
      const layoutQuery = computed<Record<string, unknown>>({
        get: () => (props.layoutQuery as Record<string, unknown>) ?? {},
        set: (value) => emit('update:layoutQuery', value),
      });

      for (const key of queryKeys) {
        state[key] = computed({
          get: () => layoutQuery.value[key],
          set: (value: unknown) => {
            layoutQuery.value = { ...layoutQuery.value, [key]: value };
          },
        });
      }

      return state;
    },
  } as unknown as LayoutConfig;
}

interface Composition {
  preset: Record<string, unknown>;
  state: Record<string, unknown>;
}

/**
 * Mounts the composition against a fake Directus that stores right away and
 * returns the prop on the next tick — which is what Vue does.
 */
async function mountComposition(): Promise<Composition> {
  const { default: layout } = await import('./index');

  const preset: Record<string, unknown> = {
    layoutOptions: {},
    layoutQuery: {},
    selection: [],
  };

  const props = reactive<Record<string, unknown>>({
    collection: 'cities',
    layoutOptions: preset.layoutOptions,
    layoutQuery: preset.layoutQuery,
    selection: preset.selection,
    filter: null,
    search: null,
  });

  const emit = (event: string, value: unknown): void => {
    const key = event.replace(/^update:/, '');
    preset[key] = value;
    void nextTick(() => {
      props[key] = preset[key];
    });
  };

  const setup = (layout as { setup: (p: LayoutProps, c: { emit: typeof emit }) => unknown }).setup;
  const state = setup(props as unknown as LayoutProps, { emit }) as Record<string, unknown>;

  return { preset, state };
}

const embedded = (composition: Composition, name: 'grid' | 'map') =>
  composition.state[name] as { state: Record<string, unknown> };

/** Writes an option through the path their options panel uses. */
const writeOption = (
  composition: Composition,
  name: 'grid' | 'map',
  key: string,
  value: unknown
): void => {
  const write = embedded(composition, name).state[`onUpdate:${key}`];
  (write as (value: unknown) => void)(value);
};

const storedOptions = (composition: Composition) =>
  composition.preset.layoutOptions as Record<string, Record<string, unknown>>;

/** Two ticks: one for the prop to come back, another for its watchers to run. */
const letThePresetComeBack = async (): Promise<void> => {
  await nextTick();
  await nextTick();
};

beforeEach(() => {
  registry.layouts = [
    directusLayout('tabular', ['spacing', 'align'], ['sort', 'page']),
    directusLayout('map', ['displayTemplate', 'basemap'], ['page']),
  ];
});

/** Writes a query key through the path the embedded layout uses. */
const writeQuery = (
  composition: Composition,
  name: 'grid' | 'map',
  key: string,
  value: unknown
): void => {
  const write = embedded(composition, name).state[`onUpdate:${key}`];
  (write as (value: unknown) => void)(value);
};

const storedQuery = (composition: Composition) =>
  composition.preset.layoutQuery as Record<string, unknown>;

/** Marks an item through the path the marker and the checkbox use. */
const mark = (composition: Composition, name: 'grid' | 'map', id: string | number): void => {
  const state = embedded(composition, name).state;
  const marked = (state.selection ?? []) as (string | number)[];
  (state['onUpdate:selection'] as (value: unknown) => void)([...marked, id]);
};

const storedSelection = (composition: Composition) => composition.preset.selection;

describe('the shared selection does not lose a mark in the same tick', () => {
  it('accumulates what the map marked and what the grid marked', async () => {
    const composition = await mountComposition();

    mark(composition, 'map', 1);
    mark(composition, 'grid', 2);
    await letThePresetComeBack();

    expect(storedSelection(composition)).toEqual([1, 2]);
  });
});

/**
 * The query has the same window as the options, and it reaches more people: map
 * and grid both write to it, and `page`, `limit` and `sort` come out of the same
 * `syncRefProperty` of theirs. The Directus 10.13.1 map component, for
 * instance, writes `limit` inside its own `setup()` — that is, on mount.
 */
describe('the shared query does not lose a write in the same tick', () => {
  it('keeps two query keys changed together by the grid', async () => {
    const composition = await mountComposition();

    writeQuery(composition, 'grid', 'sort', ['-name']);
    writeQuery(composition, 'grid', 'page', 1);
    await letThePresetComeBack();

    expect(storedQuery(composition).sort).toEqual(['-name']);
    expect(storedQuery(composition).page).toBe(1);
  });

  it('keeps the map write and the grid write made in the same tick', async () => {
    const composition = await mountComposition();

    writeQuery(composition, 'map', 'page', 2);
    writeQuery(composition, 'grid', 'sort', ['-name']);
    await letThePresetComeBack();

    expect(storedQuery(composition).page).toBe(2);
    expect(storedQuery(composition).sort).toEqual(['-name']);
  });
});

describe('the layoutOptions sections do not overwrite each other', () => {
  it('keeps each embedded layout option in its own section', async () => {
    const composition = await mountComposition();

    writeOption(composition, 'map', 'displayTemplate', '{{name}}');
    await letThePresetComeBack();
    writeOption(composition, 'grid', 'spacing', 'cozy');
    await letThePresetComeBack();

    expect(storedOptions(composition).map?.displayTemplate).toBe('{{name}}');
    expect(storedOptions(composition).tabular?.spacing).toBe('cozy');
  });

  it('does not lose the map section when the grid writes in the same tick', async () => {
    const composition = await mountComposition();

    writeOption(composition, 'map', 'displayTemplate', '{{name}}');
    writeOption(composition, 'grid', 'spacing', 'cozy');
    await letThePresetComeBack();

    expect(storedOptions(composition).map?.displayTemplate).toBe('{{name}}');
    expect(storedOptions(composition).tabular?.spacing).toBe('cozy');
  });

  it("does not lose the map's own previous option written in the same tick", async () => {
    const composition = await mountComposition();

    writeOption(composition, 'map', 'displayTemplate', '{{name}}');
    writeOption(composition, 'map', 'basemap', 'Satellite');
    await letThePresetComeBack();

    expect(storedOptions(composition).map?.displayTemplate).toBe('{{name}}');
    expect(storedOptions(composition).map?.basemap).toBe('Satellite');
  });

  it("does not lose the composition's zoomOnClick when an embedded layout writes alongside", async () => {
    const composition = await mountComposition();

    const zoomOnClick = composition.state.zoomOnClick as { value: boolean | undefined };
    zoomOnClick.value = true;
    writeOption(composition, 'grid', 'spacing', 'cozy');
    await letThePresetComeBack();

    expect(storedOptions(composition).zoomOnClick).toBe(true);
    expect(storedOptions(composition).tabular?.spacing).toBe('cozy');
  });
});
