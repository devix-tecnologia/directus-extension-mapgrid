/**
 * SPIKE — DESCARTAVEL. Apagar junto com SPIKE-tabular-embed.vue.
 *
 * v5: a logica do layout tabular, com markup nosso. Quatro perguntas:
 *   1. o `setup()` deles roda sem o componente deles montado?
 *   2. o `render-display` e alcancavel por extensao?
 *   3. a consulta cai para uma so, agora que so eles buscam?
 *   4. o clique na linha e a ordenacao continuam funcionando, sendo nossos?
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

test('SPIKE v5: logica deles, markup nosso', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    const text = message.text();
    if (/failed to resolve component|warn/i.test(text)) errors.push(`[console] ${text}`);
  });

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
  await expect(page.locator('.nossa-grade')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(8_000);

  const status = async () => (await page.locator('.spike-status').innerText()).replace(/\s+/g, ' ');
  const bar = async () => (await page.locator('.spike-bar').innerText()).replace(/\s+/g, ' ');

  console.log(`\n[1] o setup rodou de pe? grade visivel = ${await page.locator('.nossa-grade').count()}`);
  console.log(`[2] ${await bar()}`);
  console.log(`[3] buscas de itens: ${calls.length}`);
  calls.forEach((call, index) => console.log(`      [${index + 1}] ${call}`));
  console.log(`[estado] ${await status()}`);

  const cells = await page.locator('.nossa-grade tbody tr').first().allInnerTexts();
  console.log(`[celulas da 1a linha] ${JSON.stringify(cells)}`);
  await page.screenshot({ path: 'test-results/spike5-01-inicial.png' });

  // 4a: o clique na linha e nosso — nao pode navegar
  const urlBefore = page.url();
  await page.locator('.nossa-grade tbody tr').nth(2).click();
  await page.waitForTimeout(3_000);
  console.log(`\n[4a] navegou? ${page.url() !== urlBefore}`);
  console.log(`[4a] ${await status()}`);
  await page.screenshot({ path: 'test-results/spike5-02-clique.png' });

  // 4b: a ordenacao e deles, chamada pelo nosso cabecalho
  const firstCell = () => page.locator('.nossa-grade tbody tr td').first();
  const before = (await firstCell().innerText()).trim();
  await page.locator('.nossa-grade thead th').first().click();
  await page.waitForTimeout(4_000);
  const after = (await firstCell().innerText()).trim();
  console.log(`\n[4b] primeira celula antes=${before} depois=${after} mudou=${before !== after}`);
  console.log(`[4b] ${await status()}`);
  console.log(`[4b] buscas ate aqui: ${calls.length}`);
  await page.screenshot({ path: 'test-results/spike5-03-ordenado.png' });

  console.log(`\n[erros na pagina] ${errors.length === 0 ? 'nenhum' : JSON.stringify(errors)}`);
});
