/**
 * SPIKE — DESCARTAVEL. Apagar junto com SPIKE-tabular-embed.vue.
 *
 * O host nao alcanca o container neste ambiente, entao a observacao roda de
 * dentro da rede do docker, como o resto do e2e.
 *
 * v2: mede o tabular e o mapa na mesma tela — se o tabular aguenta meia tela, se
 * o clique na linha pode deixar de navegar, e se o mapa vive dos itens dele.
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

test('SPIKE: o tabular e o mapa na mesma tela', async ({ page }) => {
  page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));

  await ensureMapGridPreset();
  await login(page);

  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.spike-split')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.spike-grid table')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

  // o mapa precisa de um tempo para desenhar antes da captura
  await page.waitForTimeout(5_000);

  const status = async () => (await page.locator('.spike-status').innerText()).replace(/\s+/g, ' ');
  console.log(`\n[status inicial] ${await status()}`);

  await page.screenshot({ path: 'test-results/spike2-01-split.png', fullPage: false });

  const rows = page.locator('.spike-grid tbody tr');
  console.log(`linhas no tabular embutido: ${await rows.count()}`);

  // a pergunta central: o clique na linha ainda navega para o item?
  const urlBefore = page.url();
  await rows.nth(2).click();
  await page.waitForTimeout(3_000);

  console.log(`[status apos clique] ${await status()}`);
  console.log(`url antes:  ${urlBefore}`);
  console.log(`url depois: ${page.url()}`);
  console.log(`navegou para o item? ${page.url() !== urlBefore}`);

  await page.screenshot({ path: 'test-results/spike2-02-apos-clique.png', fullPage: false });

  // e o menu de contexto, que continua sendo o do tabular
  const header = page.locator('.spike-grid thead th').nth(2);
  if (await header.isVisible()) {
    await header.click();
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: 'test-results/spike2-03-menu.png', fullPage: false });
  }
});
