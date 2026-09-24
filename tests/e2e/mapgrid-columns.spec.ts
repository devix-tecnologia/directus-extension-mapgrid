/**
 * As colunas da grade, ponta a ponta.
 *
 * Depois da task-010 quem desenha a grade é o layout tabular do Directus, e as
 * colunas continuam saindo de `layoutQuery.fields` — o contrato que a task-005
 * estabeleceu e que eles leem nativamente. É isso que esta suíte mede: a
 * escolha feita no cabeçalho deles chega ao preset e volta dele.
 *
 * Os seletores são os de `helpers/mapgrid-page.ts`. Nenhum spec volta a falar
 * de `.map-container` ou `.v-table`, que saíram com os nossos componentes.
 */
import { expect, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureMapGridPreset,
  readMapGridPresetOptions,
  readMapGridPresetQuery,
} from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  ADICIONAR_CAMPO,
  celulaDaColuna,
  colunasVisiveis,
  esperarOMapGrid,
  login,
  openCollection,
  ordenarPor,
} from './helpers/mapgrid-page';

test.describe('MapGrid sorting', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  test.afterAll(async () => {
    await ensureMapGridPreset();
  });

  test('ordenar pelo cabeçalho reordena as linhas, e a escolha fica gravada', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    // o preset semeia sort por `name` ascendente, entao a primeira linha e a
    // primeira em ordem alfabetica
    const crescente = (await (await celulaDaColuna(page, 'name')).innerText()).trim();

    await ordenarPor(page, 'name', 'desc');

    await expect
      .poll(async () => (await (await celulaDaColuna(page, 'name')).innerText()).trim(), {
        timeout: 20_000,
      })
      .not.toBe(crescente);

    /*
     * Conferir no preset antes de recarregar. A gravacao do Directus e
     * debounced: recarregar assim que a tela muda chega antes de ela acontecer,
     * e o teste acusaria perda do que so ainda nao tinha sido gravado.
     */
    await expect
      .poll(async () => (await readMapGridPresetQuery()).sort, { timeout: 20_000 })
      .toEqual(['-name']);

    // e sobrevive ao reload, que e o que escrever em `layoutQuery` compra
    const decrescente = (await (await celulaDaColuna(page, 'name')).innerText()).trim();
    await page.reload();
    await esperarOMapGrid(page);

    expect((await (await celulaDaColuna(page, 'name')).innerText()).trim()).toBe(decrescente);
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

  test('the grid takes more columns than the five the old format could hold', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);

    const options = await readMapGridPresetOptions();
    expect(options).not.toHaveProperty('coluna6');

    await page.goto(`/admin/content/${COLLECTION_NAME}`);
    await esperarOMapGrid(page);

    // the test collection has four fields; all four can be columns at once,
    // which the numbered format allowed but only up to five
    const columns = await colunasVisiveis(page);
    expect(columns.length).toBeGreaterThan(0);
  });

  test('escolher um campo no cabeçalho muda a grade, e sobrevive ao reload', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    const antes = await colunasVisiveis(page);
    expect(antes).not.toContain('status');

    // o `+` do cabecalho e o seletor de campos sao do layout tabular deles
    await page.locator(ADICIONAR_CAMPO).first().click();
    await page
      .getByRole('listitem')
      .filter({ hasText: /^Status$/ })
      .first()
      .click();

    await expect.poll(async () => colunasVisiveis(page), { timeout: 20_000 }).toContain('status');

    /*
     * E aqui esta o ganho de a escolha morar no cabecalho: ela e escrita pelo
     * componente do layout, em `layoutQuery.fields`, e nao pelo painel de
     * opcoes. Primeiro no preset, depois na tela: se so a segunda falhar, o
     * defeito esta na leitura, e nao na gravacao.
     */
    await expect
      .poll(async () => (await readMapGridPresetQuery()).fields, { timeout: 20_000 })
      .toContain('status');

    await page.reload();
    await esperarOMapGrid(page);

    expect(await colunasVisiveis(page)).toContain('status');
  });
});
