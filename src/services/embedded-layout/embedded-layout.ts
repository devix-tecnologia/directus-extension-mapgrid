import { reactive, toRefs } from 'vue';
import type { EmbeddedLayout, EmbedOptions, LayoutRegistry } from './embedded-layout.types';

/**
 * Runs a Directus layout's `setup()` outside `createLayoutWrapper`.
 *
 * The official helper returns a component that draws nothing: it calls
 * `layout.setup(props, { emit })` and hands the result over through a slot.
 * Here it is the same call without the component in between — and the
 * difference matters. Directus hands the return of OUR layout's `setup()` to
 * both the component and the options panel, which are siblings in the tree.
 * Born here, the state reaches both; born inside the component, the panel would
 * be left out and would need a second wrapper — with separate state and one
 * extra fetch.
 */
export function embedLayout({ id, registry, props, emit }: EmbedOptions): EmbeddedLayout | null {
  const layout = registry.find((candidate) => candidate.id === id);
  if (!layout || typeof layout.setup !== 'function') return null;

  // `...toRefs(props)` alongside the return, as `createLayoutWrapper` does: their
  // layout component expects its own props back, and less common paths break without them
  const state = reactive({
    ...layout.setup(props, { emit }),
    ...toRefs(props),
  }) as Record<string, unknown>;

  // the `onUpdate:<key>` handlers, also as the helper does: a key that is a prop
  // goes up as an emit, a key that is not stays in the local state
  for (const key of Object.keys(state)) {
    state[`onUpdate:${key}`] = (value: unknown) => {
      if (key in props) emit(`update:${key}`, value);
      else state[key] = value;
    };
  }

  const embedded: EmbeddedLayout = {
    id,
    state,
    component: layout.component ?? null,
    optionsComponent: layout.slots?.options ?? null,
  };

  reportContract(embedded);

  return embedded;
}

/**
 * Shouts what is missing, and shouting instead of throwing is deliberate.
 *
 * Taking the screen down over a renamed key would trade a half-broken
 * composition for no composition at all, and whoever uses the extension gains
 * nothing from that. What must not happen is the gap passing in silence: the
 * console message is what `tests/e2e/mapgrid-contract.spec.ts` watches against
 * a real Directus, where the defect would show up first.
 */
function reportContract(embedded: EmbeddedLayout): void {
  const missing = checkContract(embedded);
  if (missing.length === 0) return;

  console.error(
    `${CONTRACT_MARKER}: the Directus layout "${embedded.id}" did not return ${missing.join(', ')}. ` +
      'The MapGrid composition reads those keys; without them it degrades in silence.'
  );
}

/**
 * What the composition READS from each embedded layout.
 *
 * None of these keys is public Directus API: they are the return of the
 * `setup()` of layouts that were not made to run embedded. An update that
 * renames any of them raises no exception — the grid goes empty, pagination
 * sticks on one page, clicking a row navigates away again, the map cannot find
 * the geometry. A silent failure, and far from its cause.
 *
 * That is why the list lives here and is checked on every embed. Every key has
 * a caller of ours:
 *
 * - `items`, `loading`, `error`, `totalPages`, `itemCount`, `totalCount` and
 *   `refresh` are what `src/index.ts` returns to the app to draw the count,
 *   the pagination and the bulk actions;
 * - `tableHeaders`, `tableSort` and `onSortChange` are their grid's header
 *   menu;
 * - `onRowClick` and `handleClick` are the two keys `MapgridLayout.vue`
 *   **overrides**: lose the key, lose the override, and the click takes the
 *   person out of the MapGrid again;
 * - `geojson`, `geojsonBounds`, `geometryField`, `featureId`,
 *   `isGeometryFieldNative`, `cameraOptions` and `fitDataBounds` are what
 *   `DirectusMapCenterer` reads from and writes to the map.
 *
 * The values come from the 2026-09-24 measurement against Directus 10.13.1,
 * checked by `tests/e2e/mapgrid-contract.spec.ts` — that is where the real
 * Directus comes in, and it is what fails when a new version changes the
 * return.
 */
export const EMBEDDED_CONTRACT = {
  tabular: [
    'items',
    'loading',
    'error',
    'totalPages',
    'itemCount',
    'totalCount',
    'refresh',
    'tableHeaders',
    'tableSort',
    'onSortChange',
    'onRowClick',
  ],
  map: [
    'items',
    'geojson',
    'geojsonBounds',
    'geometryField',
    'featureId',
    'isGeometryFieldNative',
    'cameraOptions',
    'fitDataBounds',
    'handleClick',
    'refresh',
  ],
} as const satisfies Record<string, readonly string[]>;

/**
 * The options panel is part of the contract for the same reason the keys are:
 * without `slots.options` the sidebar loses both layouts' native configuration,
 * and the MapGrid becomes a composition that cannot be configured.
 */
export const OPTIONS_SLOT = 'slots.options';

/** The prefix by which the e2e recognises the failure in the browser console. */
export const CONTRACT_MARKER = '[mapgrid] broken contract';

type IdWithContract = keyof typeof EMBEDDED_CONTRACT;

const hasContract = (id: string): id is IdWithContract => id in EMBEDDED_CONTRACT;

/**
 * What an embedded layout is missing for the composition to work.
 *
 * It checks the **presence** of the key, not the value: `cameraOptions` starts
 * with no value until someone moves the camera and `error` stays null with no
 * error, so demanding a value would raise a false alarm on every first visit.
 * What is measured is whether Directus still returns the key under that name.
 */
export function checkContract(embedded: EmbeddedLayout | null): string[] {
  if (!embedded || !hasContract(embedded.id)) return [];

  const missing = EMBEDDED_CONTRACT[embedded.id].filter((key) => !(key in embedded.state));

  return embedded.optionsComponent ? missing : [...missing, OPTIONS_SLOT];
}

/** The ids the composition has to find in the app's registry. */
export const EMBEDDED_LAYOUTS = { grid: 'tabular', map: 'map' } as const;

export const isLayoutRegistered = (registry: LayoutRegistry, id: string): boolean =>
  registry.some((layout) => layout.id === id);
