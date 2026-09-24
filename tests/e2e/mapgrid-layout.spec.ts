/**
 * O MapGrid compõe os dois layouts do Directus.
 *
 * Este é o teste que prova o desenho da task-010, e só o e2e pode: o Storybook
 * não alcança os layouts do Directus, porque lá o SDK é um mock nosso e o
 * registro de layouts não existe.
 */
import { expect, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import {
  ensureMapGridPreset,
  ensureMapGridPresetCentradoEm,
  readMapGridPresetQuery,
} from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  clicarNoPontoCentral,
  GRADE,
  linhaDe,
  login,
  MAPA,
  openCollection,
  ordenarPor,
  PAINEL_GRADE,
  TABELA,
} from './helpers/mapgrid-page';

/**
 * A cidade mais isolada da semente, e a câmera que a põe no centro do canvas.
 *
 * Achar um marcador numa tela de MapLibre exige saber onde a câmera está, e a
 * instância do mapa é do layout do Directus. O preset resolve isso pelo outro
 * lado: ele diz de onde a câmera parte, e aí o ponto semeado nasce no centro.
 * Manaus porque é a mais isolada — no zoom 12 nenhum outro ponto da semente
 * aparece, então o clique não tem como cair noutro marcador nem num
 * agrupamento.
 */
const CIDADE_ISOLADA = 'Manaus';
const MANAUS: [number, number] = [-60.0255, -3.119];
const ZOOM_DE_CIDADE = 12;

/** O contrário: uma câmera de onde nenhum ponto da semente está no centro. */
const ATLANTICO: [number, number] = [0, 0];
const ZOOM_DE_MUNDO = 1;

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — a composição', () => {
  test('desenha o mapa e a grade do Directus, não os nossos', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    await expect(page.locator(MAPA)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(GRADE)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TABELA)).toBeVisible({ timeout: 60_000 });
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

    await ordenarPor(page, 'name', 'desc');

    await expect
      .poll(async () => (await readMapGridPresetQuery()).sort, { timeout: 20_000 })
      .toEqual(['-name']);
  });

  /*
   * A regressão que a reescrita do spec perdeu, e que o desenho novo precisa
   * devolver: o `handleClick` do layout de mapa do Directus faz `router.push`
   * para a tela do item, então um marcador clicado levava a pessoa para fora do
   * MapGrid — o oposto de sincronizar as duas metades.
   */
  test('clicar num ponto marca a linha dele na grade, e não sai do MapGrid', async ({ page }) => {
    await ensureMapGridPresetCentradoEm(MANAUS, ZOOM_DE_CIDADE);
    await login(page);
    await openCollection(page);

    const linha = linhaDe(page, CIDADE_ISOLADA);
    await expect(linha).toBeVisible({ timeout: 60_000 });
    await expect(linha.getByRole('checkbox')).toHaveAttribute('aria-pressed', 'false');

    await clicarNoPontoCentral(page);

    await expect(linha.getByRole('checkbox')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15_000,
    });
    await expect(page).toHaveURL(new RegExp(`/admin/content/${COLLECTION_NAME}(\\?|$)`));
  });

  /*
   * A única prova possível de que o enquadramento acontece na TELA: a escrita
   * em `cameraOptions` chegaria ao preset mesmo com o mapa parado, então o
   * preset não serve de testemunha. Se depois do clique na linha há um ponto
   * clicável no centro do canvas, e clicar nele marca justamente aquela linha,
   * o mapa foi até o item.
   *
   * Esteve em `test.fixme` enquanto o clique escrevia em `cameraOptions`, que o
   * componente de mapa do Directus só lê ao montar. Passa pelo
   * `CentralizadorDoMapaDirectus`, o contorno documentado dessa limitação: se
   * uma atualização do Directus mudar o que o contorno usa, é este teste que
   * reprova.
   */
  test('clicar na linha enquadra o item no mapa', async ({ page }) => {
    await ensureMapGridPresetCentradoEm(ATLANTICO, ZOOM_DE_MUNDO);
    await login(page);
    await openCollection(page);

    const linha = linhaDe(page, CIDADE_ISOLADA);
    await expect(linha).toBeVisible({ timeout: 60_000 });
    await linha.click();

    await clicarNoPontoCentral(page);

    await expect(linha.getByRole('checkbox')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 15_000,
    });
  });

  test('o espaço em branco dos layouts de página inteira não aparece', async ({ page }) => {
    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);
    await page.waitForTimeout(5_000);

    const folga = await page.evaluate((seletor) => {
      const painel = document.querySelector(seletor);
      const cabecalho = document.querySelector(`${seletor} thead tr`);
      if (!painel || !cabecalho) return -1;
      return Math.round(cabecalho.getBoundingClientRect().top - painel.getBoundingClientRect().top);
    }, PAINEL_GRADE);

    // o cabecalho comeca no topo do painel; media 60px antes do acerto de CSS
    expect(folga).toBeGreaterThanOrEqual(0);
    expect(folga).toBeLessThan(12);
  });
});
