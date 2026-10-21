/**
 * The strip of still frames: the evidence format for changes that only exist in
 * motion.
 *
 * A map flight does not fit in a single capture — "the map went to the route"
 * needs the before and the after side by side. A video would show it, but it
 * cannot be attached to a task document and nobody compares two videos. The
 * strip solves it: one frame per stop, in order, in a single JPEG.
 */
import type { Page } from '@playwright/test';
import {
  EVIDENCE_DIRECTORY,
  type EvidenceMoment,
  evidenceName,
} from '../../../scripts/screenshot/index';
import { MAP_PANE } from '../../e2e/helpers/mapgrid-page';

const FRAME_WIDTH = 360;
const JPEG_QUALITY = 70;
const INTERVAL_BETWEEN_SHOTS_MS = 500;
const MAP_SETTLE_DEADLINE_MS = 20_000;

const shootTheMap = (page: Page): Promise<Buffer> =>
  page.locator(MAP_PANE).screenshot({ quality: JPEG_QUALITY, type: 'jpeg' });

/**
 * Shoots the map pane once it stops changing.
 *
 * Two identical shots in a row is the stop signal: the MapLibre flight emits
 * nothing Playwright knows how to wait for, and a fixed `waitForTimeout` either
 * shoots the middle of the flight or wastes time for nothing.
 */
export async function shootTheSettledMap(page: Page): Promise<Buffer> {
  const deadline = Date.now() + MAP_SETTLE_DEADLINE_MS;
  let previous = await shootTheMap(page);
  while (Date.now() < deadline) {
    await page.waitForTimeout(INTERVAL_BETWEEN_SHOTS_MS);
    const current = await shootTheMap(page);
    if (current.equals(previous)) return current;
    previous = current;
  }
  throw new Error(`The map did not settle in ${MAP_SETTLE_DEADLINE_MS / 1000} s`);
}

/** Joins the frames into a single image, in the order they were taken. */
export async function buildStrip(page: Page, frames: Buffer[]): Promise<Buffer> {
  const images = frames
    .map((frame) => `<img src="data:image/jpeg;base64,${frame.toString('base64')}">`)
    .join('');
  // without align-items: flex-start, flex stretches the frames to the page height
  await page.setContent(
    `<style>body{margin:0;background:#fff}` +
      `#strip{display:inline-flex;align-items:flex-start;gap:4px}` +
      `img{width:${FRAME_WIDTH}px;height:auto;flex:none}</style>` +
      `<div id="strip">${images}</div>`
  );
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  return page.locator('#strip').screenshot({ quality: JPEG_QUALITY, type: 'jpeg' });
}

/**
 * The evidence file path, or `undefined` when nobody asked for one.
 *
 * The label comes from the script, and not from the environment's
 * `EVIDENCE_LABEL`: two scripts honouring the same variable write to the SAME
 * file, and the second erases the first with no error at all. It has happened
 * in this folder.
 */
export function evidencePath(label: string): string | undefined {
  const moment = process.env.EVIDENCE_MOMENT;
  const task = process.env.EVIDENCE_TASK;
  if (!moment || !task) return undefined;
  if (moment !== 'antes' && moment !== 'depois') {
    throw new Error(
      `EVIDENCE_MOMENT must be "antes" or "depois", and it came as ${JSON.stringify(moment)}`
    );
  }
  const png = evidenceName({ moment: moment as EvidenceMoment, label, task });
  return `${EVIDENCE_DIRECTORY}/${png.replace(/\.png$/, '.jpg')}`;
}
