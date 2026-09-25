/**
 * The contract with the Directus layouts, measured against a real Directus.
 *
 * The composition reads keys from the `setup()` of the `tabular` and `map`
 * layouts — `items`, `tableHeaders`, `onSortChange`, `geometryField`,
 * `slots.options` and the others `EMBEDDED_CONTRACT` lists. None of them is
 * public API, and renaming any one **raises no exception**: the grid goes
 * empty, the row click navigates away again, the map cannot find the geometry.
 * The unit tests pin the rule with fake layouts; only here does the real
 * Directus answer.
 *
 * That is why this spec cannot be a DOM test: it watches the browser console,
 * where `embedLayout` shouts what was missing. A loud failure, with the name of
 * the key that vanished, instead of a screen spec that fails three screens
 * later.
 */
import { expect, test } from '@playwright/test';
import { CONTRACT_MARKER, EMBEDDED_CONTRACT } from '../../src/services/embedded-layout/index';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { GRID, login, MAP, openCollection, TABLE } from './helpers/mapgrid-page';

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — the contract with the embedded layouts', () => {
  test('the Directus layouts return everything the composition reads', async ({ page }) => {
    const complaints: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (text.includes(CONTRACT_MARKER)) complaints.push(text);
    });

    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    /*
     * The composition on screen is what proves `embedLayout` ran at all for
     * both ids. Without this part, "no complaint in the console" would also be
     * true on a screen where nothing mounted.
     */
    await expect(page.locator(MAP)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(GRID)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TABLE)).toBeVisible({ timeout: 60_000 });

    for (const complaint of complaints) console.log(`\n[contract] ${complaint}`);
    console.log(
      `\n[contract] checked ${EMBEDDED_CONTRACT.tabular.length} grid keys and ` +
        `${EMBEDDED_CONTRACT.map.length} map keys, plus each one's options panel`
    );

    expect(complaints).toEqual([]);
  });

  /*
   * Negative control for the test above, and it exists for a narrow reason: the
   * assertion up there is the ABSENCE of a message, and a console listener that
   * stopped working would give the same result as an intact contract. Here the
   * message is forged in the page, and the collector has to see it.
   */
  test('the console listener sees the marker, otherwise the test above is worthless', async ({
    page,
  }) => {
    const complaints: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (text.includes(CONTRACT_MARKER)) complaints.push(text);
    });

    await login(page);
    await page.evaluate(
      (marker) => console.error(`${marker}: forged by the negative control`),
      CONTRACT_MARKER
    );

    await expect.poll(() => complaints.length, { timeout: 10_000 }).toBe(1);
  });
});
