/**
 * SPIKE — DESCARTAVEL. Apagar junto com SPIKE-tabular-embed.vue.
 *
 * O host nao alcanca o container neste ambiente, entao a observacao roda de
 * dentro da rede do docker, como o resto do e2e. O que este roteiro faz e
 * abrir o layout e despejar no stdout o relatorio que o spike desenhou.
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

test('SPIKE: o que o app entrega para embutir o layout tabular', async ({ page }) => {
  page.on('console', (message) => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));

  await ensureMapGridPreset();
  await login(page);

  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.spike')).toBeVisible({ timeout: 60_000 });

  const blocks = await page.locator('.spike__report').allInnerTexts();
  console.log('\n========== RELATORIO DO SPIKE ==========');
  for (const block of blocks) console.log(block);
  console.log('========================================\n');

  const gridHtml = await page.locator('.spike__grid').innerHTML();
  console.log(`grid renderizou ${gridHtml.length} caracteres de HTML`);
  console.log(`grid tem <table>? ${gridHtml.includes('<table')}`);

  const rows = page.locator('.spike__grid tbody tr');
  const rowCount = await rows.count();
  console.log(`linhas dentro do tabular embutido: ${rowCount}`);

  if (rowCount > 0) {
    const urlBefore = page.url();
    await rows.first().click();
    await page.waitForTimeout(2_000);
    console.log(`clique na linha — antes: ${urlBefore}`);
    console.log(`clique na linha — depois: ${page.url()}`);
    console.log(`navegou para o item? ${page.url() !== urlBefore}`);
  }

  await page.screenshot({ path: 'test-results/spike-tabular.png', fullPage: true });
});
