/**
 * SPIKE — DESCARTAVEL. Apagar junto com SPIKE-tabular-embed.vue e o bloco
 * marcado em MapgridOptions.vue.
 *
 * v6: a area de configuracao. Da para compor, trazendo o painel de opcoes do
 * layout tabular para dentro do nosso? E quanto custa?
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

test('SPIKE v6: compor a area de configuracao', async ({ page }) => {
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
  await expect(page.locator('.nossa-grade')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(6_000);

  console.log(`\n[antes de abrir o painel] buscas: ${calls.length}`);
  calls.forEach((c, i) => console.log(`      [${i + 1}] ${c}`));

  // abre a barra lateral de opcoes do layout
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();
  await page.waitForTimeout(3_000);

  const spike = page.locator('[data-spike-options]');
  console.log(`\n[painel] bloco do spike presente? ${await spike.count()}`);
  if ((await spike.count()) > 0) {
    console.log(`[painel] ${(await spike.getAttribute('data-spike-options')) ?? ''}`);
  }

  // expande a secao do spike
  const section = page.getByText(/SPIKE — opcoes do tabular/i).first();
  if ((await section.count()) > 0) {
    await section.click();
    await page.waitForTimeout(4_000);
  }

  const painel = page.locator('.spike-opts__painel');
  console.log(`[painel] painel deles montou? ${await painel.count()}`);
  if ((await painel.count()) > 0) {
    const texto = (await painel.innerText()).replace(/\s+/g, ' ').slice(0, 300);
    console.log(`[painel] conteudo: ${texto || '(vazio)'}`);
    console.log(`[painel] html: ${(await painel.innerHTML()).length} caracteres`);
  }

  console.log(`\n[depois de abrir o painel] buscas: ${calls.length}`);
  calls.forEach((c, i) => console.log(`      [${i + 1}] ${c}`));

  await page.screenshot({ path: 'test-results/spike6-01-painel.png' });
  console.log(`\n[erros] ${errors.length === 0 ? 'nenhum' : JSON.stringify(errors.slice(0, 3))}`);
});
