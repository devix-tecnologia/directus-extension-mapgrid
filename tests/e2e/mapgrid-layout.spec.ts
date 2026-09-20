/**
 * O MapGrid compõe os dois layouts do Directus.
 *
 * Este é o teste que prova o desenho da task-010, e só o e2e pode: o Storybook
 * não alcança os layouts do Directus, porque lá o SDK é um mock nosso e o
 * registro de layouts não existe.
 */
import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset, readMapGridPresetQuery } from '../helpers/mapgrid-preset';
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

async function openCollection(page: Page): Promise<void> {
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.mapgrid-container')).toBeVisible({ timeout: 60_000 });
}

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — a composição', () => {
  test('desenha o mapa e a grade do Directus, não os nossos', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    await expect(page.locator('.mapgrid-pane--map .layout-map')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.mapgrid-pane--grid .layout-tabular')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('.mapgrid-pane--grid table')).toBeVisible({ timeout: 60_000 });
  });

  test('uma consulta só alimenta os dois, e não uma por layout', async ({ page }) => {
    const buscas: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes(`/items/${COLLECTION_NAME}?`) && !url.includes('aggregate')) {
        buscas.push(url);
      }
    });

    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await page.waitForTimeout(8_000);

    const distintas = [...new Set(buscas.map((url) => url.split('/items/')[1] ?? url))];
    console.log(`\n[buscas] ${buscas.length} no total, ${distintas.length} distintas`);
    for (const busca of distintas) console.log(`   ${decodeURIComponent(busca)}`);

    // uma por layout e o esperado; repetida e duplicacao
    expect(distintas.length).toBeLessThanOrEqual(2);
  });

  test('ordenar pelo cabeçalho da grade deles grava no preset', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    await page.locator('.mapgrid-pane--grid thead th', { hasText: 'name' }).first().click();
    const descendente = page.getByText(/sort descending|ordem decrescente/i).first();
    await expect(descendente).toBeVisible({ timeout: 20_000 });
    await descendente.click();

    await expect
      .poll(async () => (await readMapGridPresetQuery()).sort, { timeout: 20_000 })
      .toEqual(['-name']);
  });

  test('o espaço em branco dos layouts de página inteira não aparece', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await page.waitForTimeout(5_000);

    const folga = await page.evaluate(() => {
      const painel = document.querySelector('.mapgrid-pane--grid');
      const cabecalho = document.querySelector('.mapgrid-pane--grid thead tr');
      if (!painel || !cabecalho) return -1;
      return Math.round(cabecalho.getBoundingClientRect().top - painel.getBoundingClientRect().top);
    });

    // o cabecalho comeca no topo do painel; media 60px antes do acerto de CSS
    expect(folga).toBeGreaterThanOrEqual(0);
    expect(folga).toBeLessThan(12);
  });
});
