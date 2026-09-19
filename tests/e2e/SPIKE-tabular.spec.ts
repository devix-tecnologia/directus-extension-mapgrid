/**
 * SPIKE — DESCARTAVEL. Apagar junto com SPIKE-tabular-embed.vue.
 *
 * v7: os dois layouts do Directus (map e tabular) compostos, dividindo
 * `selection` e `layoutQuery`.
 */
import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

async function login(page: Page): Promise<void> {
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

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test('SPIKE v7: map + tabular do Directus, compostos', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await ensureMapGridPreset();
  await login(page);

  const calls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(`/items/${COLLECTION_NAME}`) && !url.includes('aggregate')) {
      calls.push(decodeURIComponent(url.split('/items/')[1] ?? url));
    }
  });

  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.spike-split')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(10_000);

  const status = async () => (await page.locator('.spike-status').innerText()).replace(/\s+/g, ' ');
  const bar = async () => (await page.locator('.spike-bar').innerText()).replace(/\s+/g, ' ');

  console.log(`\n[1] ${await bar()}`);
  console.log(`[1] o mapa deles desenhou? canvas=${await page.locator('.spike-pane--map canvas').count()}`);
  console.log(`[1] a grade deles desenhou? table=${await page.locator('.spike-pane--grid table').count()}`);

  console.log(`\n[3] buscas de itens: ${calls.length}`);
  calls.forEach((c, i) => console.log(`      [${i + 1}] ${c}`));
  console.log(`[estado] ${await status()}`);

  await page.screenshot({ path: 'test-results/spike7-01-composto.png' });

  const mapKeys = (await page.locator('[data-map-keys]').getAttribute('data-map-keys')) ?? '';
  console.log(`\n[opcoes do map] chaves do estado dele: ${mapKeys.split(',').length}`);
  console.log(`[opcoes do map] relacionadas a geometria: ${mapKeys
    .split(',')
    .filter((k) => /geo|geometry|cluster|basemap|location/i.test(k))
    .join(', ')}`);

  // 2: selecionar pela primeira celula da linha, que e onde mora o seletor
  const cell = page.locator('.spike-pane--grid tbody tr').first().locator('td').first();
  if ((await cell.count()) > 0) {
    await cell.click();
    await page.waitForTimeout(3_000);
    console.log(`\n[2] apos marcar uma linha: ${await status()}`);
    console.log(`[2] marcadores destacados no mapa? ${await page.locator('.spike-pane--map .maplibregl-marker').count()}`);
    await page.screenshot({ path: 'test-results/spike7-02-selecao.png' });
  } else {
    console.log('\n[2] nenhuma celula na grade');
  }

  // 4: ordenar pela grade deles, e ver se o layoutQuery compartilhado aguenta
  const header = page.locator('.spike-pane--grid thead th').nth(1);
  if ((await header.count()) > 0) {
    await header.click();
    await page.waitForTimeout(1_500);
    const sortItem = page.locator('[role="listitem"], .v-list-item').filter({ hasText: /descending/i }).first();
    if ((await sortItem.count()) > 0) {
      await sortItem.click();
      await page.waitForTimeout(4_000);
    }
    console.log(`\n[4] apos ordenar: ${await status()}`);
    console.log(`[4] buscas ate aqui: ${calls.length}`);
    calls.forEach((c, i) => console.log(`      [${i + 1}] ${c}`));
    await page.screenshot({ path: 'test-results/spike7-03-ordenado.png' });
  }

  console.log(`\n[erros] ${errors.length === 0 ? 'nenhum' : JSON.stringify(errors.slice(0, 3))}`);
});
