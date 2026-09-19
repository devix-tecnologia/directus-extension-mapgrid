/**
 * SPIKE v9 — DESCARTAVEL.
 *
 * Os dois layouts do Directus, com o `setup()` de cada um chamado do nosso, e
 * os dois paineis de configuracao na barra lateral.
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

test('SPIKE v9: os dois layouts e as duas configuracoes', async ({ page }) => {
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
  await expect(page.locator('.spike-bar')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(10_000);

  console.log(`\n[1] ${(await page.locator('.spike-bar').innerText()).replace(/\s+/g, ' ')}`);
  console.log(`[1] mapa desenhou? canvas=${await page.locator('.spike-pane--map canvas').count()}`);
  console.log(`[1] grade desenhou? table=${await page.locator('.spike-pane--grid table').count()}`);
  console.log(`[1] ${(await page.locator('.spike-status').innerText()).replace(/\s+/g, ' ')}`);

  console.log(`\n[consultas] ${calls.length}`);
  calls.forEach((c, i) => console.log(`      [${i + 1}] ${c}`));

  await page.screenshot({ path: 'test-results/spike9-01-dois.png' });

  // de onde vem o espaco em branco em cada painel
  for (const pane of ['.spike-pane--map', '.spike-pane--grid']) {
    const arvore = await page.evaluate((selector) => {
      const root = document.querySelector(selector);
      if (!root) return 'painel ausente';
      const linhas: string[] = [];
      const topoDoPainel = root.getBoundingClientRect().top;
      const anda = (el: Element, nivel: number) => {
        if (nivel > 5) return;
        const box = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const classe = (el.className || '').toString().split(' ').slice(0, 2).join('.');
        linhas.push(
          `${'  '.repeat(nivel)}${el.tagName.toLowerCase()}.${classe} ` +
            `dy=${Math.round(box.top - topoDoPainel)} h=${Math.round(box.height)} ` +
            `pad=${cs.paddingTop}/${cs.paddingBottom} mar=${cs.marginTop}/${cs.marginBottom} ` +
            `pos=${cs.position} tr=${cs.transform === 'none' ? '-' : cs.transform}`
        );
        for (const filho of Array.from(el.children).slice(0, 4)) anda(filho, nivel + 1);
      };
      anda(root, 0);
      return linhas.join('\n');
    }, pane);
    console.log(`\n[arvore ${pane}]\n${arvore}`);
  }

  // os dois paineis de configuracao
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();
  await page.waitForTimeout(2_000);

  for (const label of [/opcoes da grade deles/i, /opcoes do mapa deles/i]) {
    const section = page.getByText(label).first();
    if ((await section.count()) > 0) {
      await section.click();
      await page.waitForTimeout(2_500);
    }
  }

  for (const which of ['grade', 'mapa']) {
    const panel = page.locator(`[data-spike-panel="${which}"]`);
    if ((await panel.count()) > 0) {
      console.log(`\n[painel ${which}] ${(await panel.innerText()).replace(/\s+/g, ' ').slice(0, 240)}`);
    } else {
      console.log(`\n[painel ${which}] ausente`);
    }
  }

  console.log(`\n[consultas depois dos paineis] ${calls.length}`);
  await page.screenshot({ path: 'test-results/spike9-02-paineis.png' });

  // sincronia: marcar na grade deve aparecer no estado compartilhado
  const cell = page.locator('.spike-pane--grid tbody tr').first().locator('td').first();
  if ((await cell.count()) > 0) {
    await cell.click();
    await page.waitForTimeout(3_000);
    console.log(`\n[sincronia] ${(await page.locator('.spike-status').innerText()).replace(/\s+/g, ' ')}`);
    await page.screenshot({ path: 'test-results/spike9-03-selecao.png' });
  }

  console.log(`\n[erros] ${errors.length === 0 ? 'nenhum' : JSON.stringify(errors.slice(0, 3))}`);
});
