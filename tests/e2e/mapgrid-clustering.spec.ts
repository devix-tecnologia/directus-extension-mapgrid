/** Zoom 3 puts the southeast cities inside one cluster. */
import { expect, type Page, test } from '@playwright/test';
import { ensureMapGridPreset, readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { projectToScreenPoint } from './helpers/map-projection';
import {
  control,
  currentRecord,
  login,
  MAP_CANVAS,
  MAP_PANE,
  openCollection,
} from './helpers/mapgrid-page';

/** The mark the composition draws over their map, which is ours. */
const CURRENT_POINT = `${MAP_PANE} [data-current-point]`;

const SOUTHEAST: [number, number] = [-47, -20];
const WIDE_ZOOM = 3;
/** First by `name` among the eight seeded cities, and inside the cluster at this zoom. */
const FIRST_RECORD = 'Belo Horizonte';
const BELO_HORIZONTE: [number, number] = [-43.9386, -19.9191];
/** The mark is placed from the camera the map publishes; a few pixels of rounding are expected. */
const TOLERANCE_PX = 6;

const centreOfTheMark = async (page: Page): Promise<{ x: number; y: number }> => {
  const box = await page.locator(CURRENT_POINT).boundingBox();
  if (!box) throw new Error('The mark of the current record has no bounding box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — the current record inside a cluster', () => {
  test('gets a mark of its own, on the record, without turning the clustering off', async ({
    page,
  }) => {
    await ensureMapGridPreset(undefined, {
      options: {
        cameraTracking: 'off',
        map: {
          cameraOptions: { center: SOUTHEAST, zoom: WIDE_ZOOM },
          clusterData: true,
          geometryField: 'location',
        },
        zoomOnClick: false,
      },
      query: { limit: 8 },
    });
    await login(page);
    await openCollection(page);

    // nothing is current yet, and nothing is drawn
    await expect(page.locator(CURRENT_POINT)).toHaveCount(0);

    await control(page, 'next').click();
    await expect.poll(() => currentRecord(page), { timeout: 30_000 }).toContain(FIRST_RECORD);
    await expect(page.locator(CURRENT_POINT)).toBeVisible({ timeout: 30_000 });

    const canvas = await page.locator(MAP_CANVAS).boundingBox();
    if (!canvas) throw new Error('The map canvas has no bounding box');
    const expected = projectToScreenPoint(
      { center: SOUTHEAST, zoom: WIDE_ZOOM },
      { height: canvas.height, width: canvas.width },
      BELO_HORIZONTE
    );
    const mark = await centreOfTheMark(page);

    expect(Math.abs(mark.x - (canvas.x + expected.x))).toBeLessThan(TOLERANCE_PX);
    expect(Math.abs(mark.y - (canvas.y + expected.y))).toBeLessThan(TOLERANCE_PX);

    // the mark walks with the record, and the cluster stays a cluster
    await control(page, 'next').click();
    await expect
      .poll(async () => (await centreOfTheMark(page)).x, { timeout: 30_000 })
      .not.toBeCloseTo(mark.x, 0);

    const options = (await readMapGridPresetOptions()).map as { clusterData?: boolean } | undefined;
    expect(options?.clusterData).toBe(true);
  });
});
