import { expect, test } from '@playwright/test';
import { EMPTY_COLLECTION_NAME } from '../helper-collection';
import {
  ATRIBUICAO_DE_TESTE,
  BASEMAP_DE_TESTE,
  configurarBasemapDoProjeto,
  removerBasemapsDoProjeto,
  servirTilesDeTeste,
} from '../helpers/basemap-do-projeto';
import { ensureMapGridPreset, ensureMapLayoutPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  abrirOpcoesDoLayout,
  abrirSecaoDasOpcoes,
  escolherNoSeletor,
  login,
  MAPA,
  OPCOES_DO_MAPA,
  openCollection,
} from './helpers/mapgrid-page';

const NOME_DO_BASEMAP = new RegExp(BASEMAP_DE_TESTE);

test.describe('MapGrid — o basemap configurado no projeto', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
    await configurarBasemapDoProjeto();
  });

  test.afterAll(async () => {
    await removerBasemapsDoProjeto();
  });

  test.beforeEach(async () => {
    await ensureMapGridPreset();
  });

  test('o basemap do Project Settings aparece no painel do MapGrid e desenha o mapa', async ({
    page,
  }) => {
    const tilesPedidos = await servirTilesDeTeste(page);
    await login(page);
    await openCollection(page);
    await abrirOpcoesDoLayout(page);
    await abrirSecaoDasOpcoes(page, OPCOES_DO_MAPA);

    await escolherNoSeletor(page, OPCOES_DO_MAPA, NOME_DO_BASEMAP);

    await expect.poll(tilesPedidos, { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('a atribuição do basemap aparece no canto do mapa', async ({ page }) => {
    await servirTilesDeTeste(page);
    await login(page);
    await openCollection(page);
    await abrirOpcoesDoLayout(page);
    await abrirSecaoDasOpcoes(page, OPCOES_DO_MAPA);
    await escolherNoSeletor(page, OPCOES_DO_MAPA, NOME_DO_BASEMAP);

    await expect(page.locator(`${MAPA} .maplibregl-ctrl-attrib`)).toContainText(
      ATRIBUICAO_DE_TESTE,
      { timeout: 20_000 }
    );
  });

  test('a escolha é a do app: o layout de mapa puro de outra coleção passa a usar o mesmo basemap', async ({
    page,
  }) => {
    await ensureMapLayoutPreset(EMPTY_COLLECTION_NAME);
    const tilesPedidos = await servirTilesDeTeste(page);
    await login(page);
    await openCollection(page);
    await abrirOpcoesDoLayout(page);
    await abrirSecaoDasOpcoes(page, OPCOES_DO_MAPA);
    await escolherNoSeletor(page, OPCOES_DO_MAPA, NOME_DO_BASEMAP);
    await expect.poll(tilesPedidos, { timeout: 20_000 }).toBeGreaterThan(0);

    // navegação dentro do app, sem recarregar: vale esteja a escolha em memória ou no navegador
    await page.locator(`a[href$="/content/${EMPTY_COLLECTION_NAME}"]`).first().click();
    await expect(page.locator('.layout-map .maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
    const antes = tilesPedidos();
    await expect.poll(tilesPedidos, { timeout: 20_000 }).toBeGreaterThan(antes);
  });
});
