/**
 * The MapGrid's DOM anchors, in one place.
 *
 * After task-010 what draws are the Directus layouts, not our components:
 * `.map-container`, `.v-table`, `[data-sort-desc]` and `[data-remove-field]`
 * no longer exist. Three specs repeated those selectors, and all three went on
 * waiting for a screen that is gone.
 *
 * What is still ours are the composition's two panes — `.mapgrid-pane--map`
 * and `.mapgrid-pane--grid` — and everything here starts from them. Inside
 * them, what is looked up is the Directus layout class (`.layout-map`,
 * `.layout-tabular`), never an internal detail of `v-table`.
 */
import { expect, type Page } from '@playwright/test';
import { COLLECTION_NAME } from '../../helper-collection';
import { testEnv } from '../../test-env';

/** Each embedded layout's pane. Ours, and the only ones that are. */
export const MAP_PANE = '.mapgrid-pane--map';
export const GRID_PANE = '.mapgrid-pane--grid';

/** The Directus layout inside each pane. */
export const MAP = `${MAP_PANE} .layout-map`;
export const GRID = `${GRID_PANE} .layout-tabular`;

/** The table the grid draws, and the parts of it the specs look at. */
export const TABLE = `${GRID_PANE} table`;
export const HEADERS = `${GRID_PANE} thead th`;
export const ROWS = `${GRID_PANE} tbody tr`;

/** The `+` that opens the field picker, in their tabular layout's header. */
export const ADD_FIELD = `${GRID_PANE} thead .add-field`;

/** The MapLibre canvas, which is where the markers are drawn. */
export const MAP_CANVAS = `${MAP_PANE} .maplibregl-canvas`;

const LOADING = 60_000;

export async function login(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_EMAIL);
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(testEnv.DIRECTUS_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
}

/**
 * Waits for the composition to be up. Waiting only for the map is not enough:
 * it shows up before the grid, and a column spec would measure the header
 * before it exists.
 */
export async function waitForMapGrid(page: Page): Promise<void> {
  await expect(page.locator(MAP)).toBeVisible({ timeout: LOADING });
  await expect(page.locator(TABLE)).toBeVisible({ timeout: LOADING });
}

export async function openCollection(page: Page, collection = COLLECTION_NAME): Promise<void> {
  await page.goto(`/admin/content/${collection}`);
  await waitForMapGrid(page);
}

/**
 * The data columns the grid shows, in order.
 *
 * The labels come from the field's `name`, which Directus derives from the key:
 * the `name` field shows up as "Name". That is why the comparison is
 * lowercased — what the test states is which field is on screen, not how it was
 * capitalised. The empty cells are the checkbox one and the `+` one, which are
 * not fields.
 */
export async function visibleColumns(page: Page): Promise<string[]> {
  const headers = page.locator(HEADERS);
  await expect(headers.first()).toBeVisible({ timeout: 30_000 });

  const labels = await headers.allInnerTexts();
  return labels.map((label) => label.trim().toLowerCase()).filter((label) => label !== '');
}

/**
 * The first row's cell under a column, found by the header's position.
 *
 * Counting columns by hand does not work: their table starts with the checkbox
 * and may gain the manual sort handle when the collection has a `sort` field.
 * Since those columns also show up in the `thead`, the label's position is the
 * cell's position.
 */
export async function columnCell(page: Page, field: string) {
  const labels = await page.locator(HEADERS).allInnerTexts();
  const index = labels.findIndex((label) => label.trim().toLowerCase() === field.toLowerCase());
  if (index === -1) throw new Error(`Column "${field}" is not in the grid: ${labels.join(', ')}`);

  return page.locator(ROWS).first().locator('td').nth(index);
}

/**
 * Sorts by a column through the path the Directus tabular layout offers: the
 * header click opens the context menu, and sorting lives inside it. Not our
 * choice — `v-table` swaps the sorting click for opening the menu as soon as
 * the `header-context-menu` slot exists, and they use that slot.
 */
export async function sortBy(page: Page, field: string, direction: 'asc' | 'desc'): Promise<void> {
  await page
    .locator(HEADERS, { hasText: new RegExp(`^${field}$`, 'i') })
    .first()
    .click();

  const item =
    direction === 'desc'
      ? page.getByText(/sort descending|ordem decrescente/i).first()
      : page.getByText(/sort ascending|ordem crescente/i).first();

  await expect(item).toBeVisible({ timeout: 20_000 });
  await item.click();
}

/** The grid row that talks about an item, found by a cell's text. */
export function rowOf(page: Page, text: string) {
  return page.locator(ROWS, { hasText: text }).first();
}

/**
 * Clicks the marker at the centre of the map canvas.
 *
 * Two things, and both have to be this way. Finding a marker on a MapLibre
 * screen requires knowing where the camera is, and the map instance belongs to
 * the Directus layout — unreachable from outside; what says where the camera
 * starts is the seeded preset, and then the seeded point is born at the centre.
 *
 * And waiting for the canvas to show up is not enough: the point layer draws
 * later, and a click before that falls on nothing — that is what made this spec
 * fail with the marker visible in the screenshot. The signal that there is a
 * point under the mouse is the canvas cursor turning into `pointer`, which
 * MapLibre itself sets when entering an interactive layer. Measured: it takes
 * ~2s after the grid shows up.
 */
export async function clickCenterMarker(page: Page): Promise<void> {
  const canvas = page.locator(MAP_CANVAS);
  await expect(canvas).toBeVisible({ timeout: LOADING });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('The map canvas has no bounding box');

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await expect
    .poll(
      async () => {
        // the cursor only changes on movement: two points, so there is a `mousemove`
        await page.mouse.move(x + 1, y);
        await page.mouse.move(x, y);
        return canvas.evaluate((element) => getComputedStyle(element).cursor);
      },
      { timeout: 30_000 }
    )
    .toBe('pointer');

  await page.mouse.click(x, y);
}

/**
 * The options panel's sections. The classes are ours, set in
 * `MapgridOptions.vue`: inside each section what draws is the Directus panel,
 * and its labels change with locale and version.
 */
export const MAP_OPTIONS = '.mapgrid-option--map';
export const GRID_OPTIONS = '.mapgrid-option--grid';
export const ZOOM_OPTIONS = '.mapgrid-option--zoom';

/**
 * Opens the layout options drawer in the sidebar. It comes collapsed, and the
 * options only exist in the DOM afterwards — looking for them before this finds
 * nothing.
 */
export async function openLayoutOptions(page: Page): Promise<void> {
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();

  await expect(page.locator(ZOOM_OPTIONS)).toBeVisible({ timeout: 30_000 });
}

/**
 * Expands a panel section. The Directus `v-detail` only puts the content in the
 * DOM when open, so the proof that it opened is `.content` existing — and not
 * the header class, which does not change.
 *
 * `> .content` on purpose, and not `.content`: inside the map section their
 * display template has a `span.content` of its own, the contenteditable, and a
 * descendant selector matches both.
 */
export async function openOptionsSection(page: Page, section: string): Promise<void> {
  const detail = page.locator(section);
  await expect(detail).toBeVisible({ timeout: 30_000 });

  const content = page.locator(`${section} > .content`);
  if ((await content.count()) === 0) await detail.locator('.v-divider').first().click();

  await expect(content).toBeVisible({ timeout: 30_000 });
}

/**
 * Picks an item in a `v-select` inside a section. Their menu list is drawn in a
 * portal, outside the section, so the click on the item cannot be looked for
 * inside it.
 */
export async function pickInSelect(page: Page, section: string, item: RegExp): Promise<void> {
  await page.locator(`${section} .v-select`).first().click();

  const option = page.getByRole('listitem').filter({ hasText: item }).first();
  await expect(option).toBeVisible({ timeout: 20_000 });
  await option.click();
}
