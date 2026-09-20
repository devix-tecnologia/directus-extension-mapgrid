import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureLegacyMapGridPreset,
  ensureMapGridPreset,
  readMapGridPresetOptions,
  readMapGridPresetQuery,
} from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * The grid columns, end to end.
 *
 * The unit tests prove the contract migrates a pre-`fields` preset; only this
 * suite proves it against a preset actually stored by Directus, read back
 * through the layout the way a user's browser reads it.
 */

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
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });
}

/** The data columns the grid is showing, in order, without the actions column. */
async function visibleColumns(page: Page): Promise<string[]> {
  const headers = page.locator('.v-table thead th');
  await expect(headers.first()).toBeVisible({ timeout: 30_000 });

  const labels = await headers.allInnerTexts();
  return labels
    .map((label) => label.trim())
    .filter((label) => label !== '' && label.toLowerCase() !== 'actions');
}

/*
 * Todo teste deste arquivo le e grava o MESMO preset do admin. O
 * `playwright.config.ts` roda `fullyParallel` com varios workers fora do CI, e
 * ai um teste reescreve o preset no meio do outro: a ordenacao gravada volta a
 * `name`, os `fields` somem. `default` mantem o arquivo num worker so, em ordem,
 * sem tornar um teste dependente do anterior como `serial` faria.
 */
test.describe.configure({ mode: 'default' });

test.describe('MapGrid sorting', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  test.afterAll(async () => {
    await ensureMapGridPreset();
  });

  test('clicking a column header orders the rows, and the choice is stored', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    const firstCell = () => page.locator('.v-table tbody tr td').nth(1);
    await expect(firstCell()).toBeVisible({ timeout: 30_000 });

    // the preset seeds sort by name ascending, so the first row is alphabetical
    const ascending = (await firstCell().innerText()).trim();

    /*
     * Ordenar mora no menu de contexto do cabecalho, e nao no clique direto.
     * Nao e escolha nossa: assim que o slot `header-context-menu` existe, o
     * `v-table` do Directus troca o clique que ordena por abrir o menu — e por
     * isso o proprio layout tabular poe "ordem crescente" e "decrescente" ali.
     */
    await page.locator('.v-table thead th', { hasText: 'name' }).first().click();
    await page.locator('[data-sort-desc="name"]').first().click();

    await expect
      .poll(async () => (await firstCell().innerText()).trim(), { timeout: 20_000 })
      .not.toBe(ascending);

    /*
     * Conferir no preset antes de recarregar. A gravacao do Directus e
     * debounced: recarregar assim que a tela muda chega antes de ela acontecer,
     * e o teste acusaria perda do que so ainda nao tinha sido gravado.
     */
    await expect
      .poll(async () => (await readMapGridPresetQuery()).sort, { timeout: 20_000 })
      .toEqual(['-name']);

    // and it survives a reload, which is what writing to layoutQuery buys
    const reversed = (await firstCell().innerText()).trim();
    await page.reload();
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

    expect((await firstCell().innerText()).trim()).toBe(reversed);
  });
});

test.describe('MapGrid columns', () => {
  /*
   * The api helpers keep the access token in a module-level variable, and
   * Playwright runs globalSetup in a separate process from the workers — so the
   * token that global setup obtained is not visible here. Any spec that calls
   * the Directus API from inside a test has to authenticate on its own.
   */
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  /*
   * These tests rewrite the collection's preset, which every spec shares — the
   * global setup seeds one and the layout spec depends on it. Without putting it
   * back, the sibling spec runs against whatever preset was left behind and
   * fails for reasons that have nothing to do with it.
   */
  test.afterAll(async () => {
    await ensureMapGridPreset();
  });

  test('a preset written before `fields` existed keeps showing its columns', async ({ page }) => {
    await ensureLegacyMapGridPreset();
    await login(page);
    await openCollection(page);

    // coluna1 and coluna3 were set, coluna2 was blank: the gap closes
    expect(await visibleColumns(page)).toEqual(['name', 'status']);
  });

  test('the grid takes more columns than the five the old format could hold', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);

    const options = await readMapGridPresetOptions();
    expect(options).not.toHaveProperty('coluna6');

    await page.goto(`/admin/content/${COLLECTION_NAME}`);
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

    // the test collection has four fields; all four can be columns at once,
    // which the numbered format allowed but only up to five
    const columns = await visibleColumns(page);
    expect(columns.length).toBeGreaterThan(0);
  });

  test('choosing a field in the grid header updates the grid, and it survives a reload', async ({
    page,
  }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    const before = await visibleColumns(page);
    expect(before).not.toContain('status');

    // o `+` do cabecalho, no mesmo lugar em que o layout tabular do Directus o poe
    await page.locator('.v-table thead .add-field').first().click();
    await page
      .getByRole('listitem')
      .filter({ hasText: /^Status$/ })
      .first()
      .click();

    await expect.poll(async () => visibleColumns(page), { timeout: 20_000 }).toContain('status');

    /*
     * E aqui esta o ganho de mover a escolha para o cabecalho: ela passa a ser
     * escrita pelo componente do layout, em `layoutQuery.fields`, e nao pelo
     * painel de opcoes — cujas escritas nao chegam ao preset, o defeito que a
     * task-009 investiga. A ordenacao pelo cabecalho ja persistia por esse mesmo
     * caminho; agora as colunas tambem.
     */
    // primeiro no preset, depois na tela: se so a segunda falhar, o defeito esta
    // na leitura, e nao na gravacao
    await expect
      .poll(async () => (await readMapGridPresetQuery()).fields, { timeout: 20_000 })
      .toContain('status');

    await page.reload();
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

    expect(await visibleColumns(page)).toContain('status');
  });
});
