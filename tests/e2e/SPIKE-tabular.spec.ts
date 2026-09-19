/**
 * SPIKE — DESCARTAVEL. Apagar junto com SPIKE-tabular-embed.vue.
 *
 * v4: a consulta ao backend e feita uma vez ou duas?
 *
 * O spike alimenta o mapa com `layoutState.items` — os itens que o layout
 * embutido buscou. Mas o `setup()` em `src/index.ts` continua chamando o
 * `useItems` dele. A pergunta e se isso vira duas idas ao backend, e o que
 * exatamente cada uma pede.
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

test('SPIKE v4: quantas consultas ao backend', async ({ page }) => {
  await ensureMapGridPreset();
  await login(page);

  const calls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(`/items/${COLLECTION_NAME}`)) {
      calls.push(decodeURIComponent(url.split('/items/')[1] ?? url));
    }
  });

  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.spike-split')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(8_000);

  console.log(`\n===== TABULAR: ${calls.length} consultas a /items/${COLLECTION_NAME} =====`);
  calls.forEach((call, index) => console.log(`  [${index + 1}] ${call}`));

  const afterTabular = calls.length;
  calls.length = 0;

  await page.locator('[data-layout="cards"]').click();
  await page.waitForTimeout(8_000);

  console.log(`\n===== TROCA PARA CARDS: +${calls.length} consultas =====`);
  calls.forEach((call, index) => console.log(`  [${index + 1}] ${call}`));

  console.log(`\nresumo: tabular=${afterTabular} troca-para-cards=${calls.length}`);
});
