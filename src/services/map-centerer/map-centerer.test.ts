import { describe, expect, it, vi } from 'vitest';
import { DirectusMapCenterer } from './map-centerer';
import type { BoundingBox } from './map-centerer.types';

const VISIBLE: BoundingBox = [-40.4, -20.4, -40.2, -20.2];
const VIEWPORT = { width: 1000, height: 600 };

interface SetupOptions {
  items?: Record<string, unknown>[];
  ready?: boolean;
  visible?: BoundingBox | null;
  camera?: Record<string, unknown>;
  fetchItems?: (
    keys: readonly unknown[],
    fields: readonly string[]
  ) => Promise<Record<string, unknown>[]>;
}

function setup({
  fetchItems = async () => [],
  camera,
  items = [],
  ready = true,
  visible = VISIBLE,
}: SetupOptions = {}) {
  const collectionBbox: BoundingBox = [-41, -21, -39, -19];
  const state: Record<string, unknown> = {
    cameraOptions: camera ?? (visible ? { bbox: [...visible], zoom: 12 } : undefined),
    geojson: { bbox: [...collectionBbox], features: [], type: 'FeatureCollection' },
    geojsonBounds: undefined,
    fitDataBounds: vi.fn(),
  };
  const pending: (() => void)[] = [];
  const repeats: { cancelled: boolean; interval: number; task: () => void }[] = [];
  const centerer = new DirectusMapCenterer(
    state,
    () => VIEWPORT,
    {
      afterUpdate: (task) => pending.push(task),
      repeat: (task, interval) => {
        const repeat = { cancelled: false, interval, task };
        repeats.push(repeat);
        return () => {
          repeat.cancelled = true;
        };
      },
    },
    { fetchItems, gridItems: () => items }
  );
  if (ready) centerer.onCameraMove();
  const readBbox = () => (state.geojson as { bbox: BoundingBox }).bbox;
  const tick = () => {
    for (const repeat of repeats) if (!repeat.cancelled) repeat.task();
  };
  const active = () => repeats.filter((repeat) => !repeat.cancelled);
  const moveCamera = (bbox: BoundingBox) => {
    state.cameraOptions = { bbox: [...bbox], zoom: 5 };
    centerer.onCameraMove();
  };
  return {
    active,
    collectionBbox,
    readBbox,
    centerer,
    state,
    moveCamera,
    pending,
    repeats,
    tick,
  };
}

const point = (lng: number, lat: number) => ({ coordinates: [lng, lat], type: 'Point' });

describe('centering a point', () => {
  it('outside the visible area: triggers the Directus fitBounds by swapping bounds', () => {
    const { centerer, state } = setup();
    expect(centerer.center(point(-40.0, -20.0))).toBe(true);
    expect(state.geojsonBounds).toBeDefined();
  });

  it('the bounding box read by fitBounds is centered on the point', () => {
    const { collectionBbox, readBbox, centerer } = setup();
    centerer.center(point(-40.0, -20.0));
    expect(readBbox()).not.toEqual(collectionBbox);
    const [west, south, east, north] = readBbox();
    expect((west + east) / 2).toBeCloseTo(-40.0, 6);
    expect(south).toBeLessThan(-20.0);
    expect(north).toBeGreaterThan(-20.0);
  });

  it('keeps the zoom: the box is the visible area minus the 100 px Directus padding', () => {
    const { readBbox, centerer } = setup();
    centerer.center(point(-40.0, -20.0));
    const [west, , east] = readBbox();
    const visibleWidth = VISIBLE[2] - VISIBLE[0];
    expect(east - west).toBeCloseTo((visibleWidth * (VIEWPORT.width - 200)) / VIEWPORT.width, 9);
  });

  it('restores the collection bbox after the update, so "fit all" does not inherit the point\'s', () => {
    const { collectionBbox, readBbox, centerer, pending } = setup();
    centerer.center(point(-40.0, -20.0));
    expect(readBbox()).not.toEqual(collectionBbox);
    for (const task of pending) task();
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('does not swap the geojson object: the Directus data watcher would resend the collection', () => {
    const { centerer, state } = setup();
    const before = state.geojson;
    centerer.center(point(-40.0, -20.0));
    expect(state.geojson).toBe(before);
  });

  it('every centering delivers fresh bounds, so the watcher fires again', () => {
    const { centerer, state, pending } = setup();
    centerer.center(point(-40.0, -20.0));
    const first = state.geojsonBounds;
    for (const task of pending) task();
    centerer.center(point(-40.0, -20.0));
    expect(state.geojsonBounds).not.toBe(first);
  });

  it('inside the visible area: touches nothing', () => {
    const { collectionBbox, readBbox, centerer, state } = setup();
    expect(centerer.center(point(-40.3, -20.3))).toBe(false);
    expect(state.geojsonBounds).toBeUndefined();
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('inside the visible area, with onlyIfOutside: false, centers anyway', () => {
    const { centerer } = setup();
    expect(centerer.center(point(-40.3, -20.3), { onlyIfOutside: false })).toBe(true);
  });
});

describe('zooming in while centering', () => {
  it('with zoomIn, the point becomes its own box and the Directus fitBounds zooms to its maxZoom', () => {
    const { readBbox, centerer } = setup();
    centerer.center(point(-40.0, -20.0), { zoomIn: true, onlyIfOutside: false });
    expect(readBbox()).toEqual([-40.0, -20.0, -40.0, -20.0]);
  });

  it('zoomIn does not change how a line is framed', () => {
    const { readBbox, centerer } = setup();
    const line = {
      coordinates: [
        [-40.1, -20.1],
        [-39.7, -19.8],
      ],
      type: 'LineString',
    };
    centerer.center(line, { zoomIn: true });
    expect(readBbox()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });
});

describe('centering what is not a point', () => {
  it('a line is framed by its own box, not by its first vertex', () => {
    const { readBbox, centerer } = setup();
    const route = {
      coordinates: [
        [-40.1, -20.1],
        [-39.9, -19.8],
        [-39.7, -19.9],
      ],
      type: 'LineString',
    };
    expect(centerer.center(route)).toBe(true);
    expect(readBbox()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });

  it('a polygon with a hole and a multi-point too', () => {
    const { readBbox, centerer } = setup();
    centerer.center({
      coordinates: [
        [
          [-40.0, -20.0],
          [-39.5, -20.0],
          [-39.5, -19.5],
          [-40.0, -20.0],
        ],
      ],
      type: 'Polygon',
    });
    expect(readBbox()).toEqual([-40.0, -20.0, -39.5, -19.5]);
  });
});

describe('what cannot be read leaves the camera alone', () => {
  it.each([
    ['nothing', undefined],
    ['no coordinates', { type: 'Point' }],
    ['a coordinate that is not a number', { coordinates: ['a', 'b'], type: 'Point' }],
    ['an impossible latitude', { coordinates: [-40, -95], type: 'Point' }],
  ])('%s', (_case, geometry) => {
    const { collectionBbox, readBbox, centerer, state } = setup();
    expect(centerer.center(geometry, { onlyIfOutside: false })).toBe(false);
    expect(state.geojsonBounds).toBeUndefined();
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('with no visible area, but with the camera zoom, keeps that zoom', () => {
    const { readBbox, centerer } = setup({
      camera: { center: [-47.9, -15.8], zoom: 9 },
      visible: null,
    });
    centerer.center(point(-40.0, -20.0), { onlyIfOutside: false });
    const [west, south, east, north] = readBbox();
    const world = 512 * 2 ** 9;
    expect(east - west).toBeCloseTo((360 * (VIEWPORT.width - 200)) / world, 9);
    const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    expect(mercator(north) - mercator(south)).toBeCloseTo(
      (2 * Math.PI * (VIEWPORT.height - 200)) / world,
      9
    );
  });

  it('with no known visible area, the point is framed by its own box', () => {
    const { readBbox, centerer } = setup({ visible: null });
    expect(centerer.center(point(-40.0, -20.0))).toBe(true);
    expect(readBbox()).toEqual([-40.0, -20.0, -40.0, -20.0]);
  });
});

describe('before the Directus map finishes loading', () => {
  it('retries: delivers fresh bounds every interval, with the same box', () => {
    const { readBbox, centerer, state, tick } = setup({ ready: false });
    centerer.center(point(-40.0, -20.0));
    const first = state.geojsonBounds;
    tick();
    expect(state.geojsonBounds).not.toBe(first);
    expect(state.geojsonBounds).toEqual(first);
    expect(readBbox()).toEqual(first);
  });

  it('the target bbox stays in the geojson while retrying — the late fitBounds reads it', () => {
    const { collectionBbox, readBbox, centerer, pending, tick } = setup({
      ready: false,
    });
    centerer.center(point(-40.0, -20.0));
    for (const task of pending) task();
    tick();
    expect(readBbox()).not.toEqual(collectionBbox);
  });

  it('the first camera change ends the retry with one more bounds — the map is listening now', () => {
    const { active, collectionBbox, readBbox, centerer, state, moveCamera, pending } = setup({
      ready: false,
    });
    centerer.center(point(-40.0, -20.0));
    const before = state.geojsonBounds;
    expect(active()).toHaveLength(1);
    moveCamera([-180, -85, 180, 85]);
    expect(state.geojsonBounds).not.toBe(before);
    expect(state.geojsonBounds).toEqual(before);
    expect(active()).toHaveLength(0);
    expect(readBbox()).toEqual(before);
    for (const task of pending) task();
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('gives up at the deadline, and restores the collection bbox', () => {
    const { active, collectionBbox, readBbox, centerer, repeats, tick } = setup({
      ready: false,
    });
    centerer.center(point(-40.0, -20.0));
    const [repeat] = repeats;
    const ticks = Math.ceil(10_000 / (repeat?.interval ?? 1));
    for (let i = 0; i < ticks; i++) tick();
    expect(active()).toHaveLength(0);
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('a new target during the retry replaces it, and the restored bbox is still the collection one', () => {
    const { active, collectionBbox, readBbox, centerer, state, moveCamera, pending, tick } = setup({
      ready: false,
    });
    centerer.center(point(-40.0, -20.0));
    centerer.center(point(-39.0, -19.5));
    expect(active()).toHaveLength(1);
    tick();
    const [west, , east] = state.geojsonBounds as BoundingBox;
    expect((west + east) / 2).toBeCloseTo(-39.0, 6);
    moveCamera([-39.5, -20, -38.5, -19]);
    for (const task of pending) task();
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('once the camera has moved, the map is ready: a single bounds, no retry', () => {
    const { active, centerer, moveCamera } = setup({ ready: false });
    moveCamera(VISIBLE);
    centerer.center(point(-40.0, -20.0));
    expect(active()).toHaveLength(0);
  });
});

describe('fit all', () => {
  it('asks Directus to frame the collection', () => {
    const { centerer, state } = setup();
    centerer.fitAll();
    expect(state.fitDataBounds).toHaveBeenCalledOnce();
  });

  it('with a pending retry, restores the collection bbox first — their fitDataBounds reads it', () => {
    const { active, collectionBbox, readBbox, centerer, state } = setup({ ready: false });
    centerer.center(point(-40.0, -20.0));
    let bboxWhenCalled: unknown;
    (state.fitDataBounds as ReturnType<typeof vi.fn>).mockImplementation(() => {
      bboxWhenCalled = [...readBbox()];
    });

    centerer.fitAll();

    expect(bboxWhenCalled).toEqual(collectionBbox);
    expect(active()).toHaveLength(0);
  });

  it('with no fitDataBounds in the state, does nothing and does not break', () => {
    const { centerer, state } = setup();
    delete state.fitDataBounds;
    expect(() => centerer.fitAll()).not.toThrow();
  });
});

describe('centering an item by the feature Directus built', () => {
  const route = {
    coordinates: [
      [-40.1, -20.1],
      [-39.7, -19.8],
    ],
    type: 'LineString',
  };

  function withFeatures(features: unknown[]) {
    const harness = setup();
    harness.state.featureId = 'code';
    (harness.state.geojson as { features: unknown[] }).features = features;
    return harness;
  }

  it('frames by the feature geometry, not by the raw field — which may be csv, lnglat or wkt', () => {
    const { readBbox, centerer } = withFeatures([
      { geometry: route, properties: { code: 7 }, type: 'Feature' },
    ]);

    expect(centerer.centerItem({ code: 7, place: '-40.1,-20.1' })).toBe(true);
    expect(readBbox()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });

  it('finds the feature by the primary key the layout declares, whatever its name', () => {
    const { readBbox, centerer } = withFeatures([
      {
        geometry: { coordinates: [-39, -19], type: 'Point' },
        properties: { code: 1 },
        type: 'Feature',
      },
      { geometry: route, properties: { code: 2 }, type: 'Feature' },
    ]);

    centerer.centerItem({ code: 2 }, { onlyIfOutside: false });

    expect(readBbox()).toEqual([-40.1, -20.1, -39.7, -19.8]);
  });

  it('an item with no feature — no geometry, or off the page — leaves the camera alone', () => {
    const { collectionBbox, readBbox, centerer, state } = withFeatures([
      { geometry: route, properties: { code: 2 }, type: 'Feature' },
    ]);

    expect(centerer.centerItem({ code: 9 })).toBe(false);
    expect(state.geojsonBounds).toBeUndefined();
    expect(readBbox()).toEqual(collectionBbox);
  });

  it('with no featureId in the state, does not guess the key', () => {
    const { centerer, state } = withFeatures([
      { geometry: route, properties: { code: 2 }, type: 'Feature' },
    ]);
    delete state.featureId;

    expect(centerer.centerItem({ code: 2 })).toBe(false);
  });
});

describe('native geometry: the Directus map only has what is on screen', () => {
  const RIO_SP = {
    coordinates: [
      [-43.17, -22.9],
      [-46.63, -23.55],
    ],
    type: 'LineString',
  };
  const MANAUS_BELEM = {
    coordinates: [
      [-60.02, -3.11],
      [-48.5, -1.45],
    ],
    type: 'LineString',
  };
  const items = [
    { id: 1, route: RIO_SP },
    { id: 2, route: MANAUS_BELEM },
  ];

  function native() {
    const harness = setup({ items });
    Object.assign(harness.state, {
      featureId: 'id',
      geometryField: 'route',
      isGeometryFieldNative: true,
    });
    // the layout only fetched what falls in the visible area: Rio–SP
    (harness.state.geojson as { features: unknown[] }).features = [
      { geometry: RIO_SP, properties: { id: 1 }, type: 'Feature' },
    ];
    return harness;
  }

  it('resetting the view frames the grid items, not only what the map fetched', () => {
    const { readBbox, centerer, state } = native();

    centerer.fitAll();

    expect(readBbox()).toEqual([-60.02, -23.55, -43.17, -1.45]);
    expect(state.fitDataBounds).not.toHaveBeenCalled();
  });

  it('the off-screen item has no feature, but native geometry already comes as GeoJSON in the item', () => {
    const { readBbox, centerer } = native();

    expect(centerer.centerItem(items[1] as Record<string, unknown>)).toBe(true);
    expect(readBbox()).toEqual([-60.02, -3.11, -48.5, -1.45]);
  });

  it('without native geometry, an item with no feature still leaves the camera alone — the raw field may be csv', () => {
    const { centerer, state } = native();
    state.isGeometryFieldNative = false;

    expect(centerer.centerItem({ id: 2, route: '-60.02,-3.11' })).toBe(false);
  });

  it('without native geometry, resetting the view is still the Directus fitDataBounds', () => {
    const { centerer, state } = native();
    state.isGeometryFieldNative = false;

    centerer.fitAll();

    expect(state.fitDataBounds).toHaveBeenCalledOnce();
  });
});

describe('native geometry the grid did not bring — the column is not in sight', () => {
  const RIO_SP = {
    coordinates: [
      [-43.17, -22.9],
      [-46.63, -23.55],
    ],
    type: 'LineString',
  };
  const MANAUS_BELEM = {
    coordinates: [
      [-60.02, -3.11],
      [-48.5, -1.45],
    ],
    type: 'LineString',
  };
  const awaitFetch = () => new Promise((resolve) => setTimeout(resolve, 0));

  function withoutGeometryInTheGrid(fetchItems: SetupOptions['fetchItems']) {
    const harness = setup({ fetchItems, items: [{ id: 1 }, { id: 2 }] });
    Object.assign(harness.state, {
      featureId: 'id',
      geometryField: 'route',
      isGeometryFieldNative: true,
    });
    return harness;
  }

  it('resetting the view fetches the page items geometry by key, and frames them all', async () => {
    const fetchItems = vi.fn(async () => [
      { id: 1, route: RIO_SP },
      { id: 2, route: MANAUS_BELEM },
    ]);
    const { readBbox, centerer } = withoutGeometryInTheGrid(fetchItems);

    centerer.fitAll();
    await awaitFetch();

    expect(fetchItems).toHaveBeenCalledWith([1, 2], ['id', 'route']);
    expect(readBbox()).toEqual([-60.02, -23.55, -43.17, -1.45]);
  });

  it('clicking an off-screen row fetches that item geometry and goes to it', async () => {
    const fetchItems = vi.fn(async () => [{ id: 2, route: MANAUS_BELEM }]);
    const { readBbox, centerer } = withoutGeometryInTheGrid(fetchItems);

    expect(centerer.centerItem({ id: 2 })).toBe(true);
    await awaitFetch();

    expect(fetchItems).toHaveBeenCalledWith([2], ['id', 'route']);
    expect(readBbox()).toEqual([-60.02, -3.11, -48.5, -1.45]);
  });

  it('the answer to an old click does not beat the answer to a new one', async () => {
    const answers: Array<(items: Record<string, unknown>[]) => void> = [];
    const fetchItems = () =>
      new Promise<Record<string, unknown>[]>((resolve) => answers.push(resolve));
    const { readBbox, centerer } = withoutGeometryInTheGrid(fetchItems);

    centerer.centerItem({ id: 1 });
    centerer.centerItem({ id: 2 });
    answers[1]?.([{ id: 2, route: MANAUS_BELEM }]);
    await awaitFetch();
    answers[0]?.([{ id: 1, route: RIO_SP }]);
    await awaitFetch();

    expect(readBbox()).toEqual([-60.02, -3.11, -48.5, -1.45]);
  });

  it('if the fetch fails, resetting the view falls back to the Directus fitDataBounds', async () => {
    const { centerer, state } = withoutGeometryInTheGrid(async () => {
      throw new Error('network');
    });

    centerer.fitAll();
    await awaitFetch();

    expect(state.fitDataBounds).toHaveBeenCalledOnce();
  });
});
