/** The LPR collection on screen: opening it with a preset, and reading the current record. */
import { expect, type Page } from '@playwright/test';
import { ensureLprMapGrid, LPR_COLLECTION, placeOf } from '../../helpers/lpr-collection';
import { type CameraState, projectToScreenPoint } from './map-projection';
import { currentRecord, login, MAP_CANVAS, openCollection } from './mapgrid-page';

export type LprPreset = Parameters<typeof ensureLprMapGrid>[0];

export async function openLpr(page: Page, preset: LprPreset = {}): Promise<void> {
  await ensureLprMapGrid(preset);
  await login(page);
  await openCollection(page, LPR_COLLECTION);
}

export async function expectCurrent(page: Page, text: string): Promise<void> {
  await expect.poll(() => currentRecord(page), { timeout: 30_000 }).toContain(text);
}

/** A camera on a place of the seed, for clicks that need to know where things are drawn. */
export const cameraOn = (key: string, zoom: number): CameraState => ({
  center: placeOf(key).location,
  zoom,
});

/** Where a place of the seed is drawn on the page, under a camera the preset fixed. */
export async function pagePointOf(
  page: Page,
  camera: CameraState,
  key: string
): Promise<{ x: number; y: number }> {
  const box = await page.locator(MAP_CANVAS).boundingBox();
  if (!box) throw new Error('The map canvas has no bounding box');
  const point = projectToScreenPoint(
    camera,
    { height: box.height, width: box.width },
    placeOf(key).location
  );
  return { x: box.x + point.x, y: box.y + point.y };
}

/**
 * Waits for the point layer: MapLibre turns the cursor into a pointer over an
 * interactive feature, and before that a click lands on nothing.
 */
export async function waitForMarkerAt(page: Page, at: { x: number; y: number }): Promise<void> {
  const canvas = page.locator(MAP_CANVAS);
  await expect
    .poll(
      async () => {
        await page.mouse.move(at.x + 1, at.y);
        await page.mouse.move(at.x, at.y);
        return canvas.evaluate((element) => getComputedStyle(element).cursor);
      },
      { timeout: 30_000 }
    )
    .toBe('pointer');
}
