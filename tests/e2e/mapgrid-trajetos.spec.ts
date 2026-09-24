import { expect, test } from '@playwright/test';
import {
  COLECAO_DE_TRAJETOS,
  garantirColecaoDeTrajetos,
  garantirMapGridDosTrajetos,
} from '../helpers/colecao-de-trajetos';
import { readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { esperarOMapGrid, linhaDe, login } from './helpers/mapgrid-page';

type Retangulo = [number, number, number, number];

const RIO_SAO_PAULO: Retangulo = [-46.6333, -23.5505, -43.1729, -22.9068];
const MANAUS_BELEM: Retangulo = [-60.0255, -3.119, -48.5044, -1.4558];
const COLECAO_INTEIRA: Retangulo = [-60.0255, -23.5505, -43.1729, -1.4558];

const contem = (externo: Retangulo, interno: Retangulo): boolean =>
  interno[0] >= externo[0] &&
  interno[1] >= externo[1] &&
  interno[2] <= externo[2] &&
  interno[3] <= externo[3];

async function areaVisivel(): Promise<Retangulo | null> {
  const opcoes = await readMapGridPresetOptions(COLECAO_DE_TRAJETOS);
  const bbox = (opcoes.map as { cameraOptions?: { bbox?: unknown } } | undefined)?.cameraOptions
    ?.bbox;
  return Array.isArray(bbox) && bbox.length === 4 ? (bbox as Retangulo) : null;
}

test.describe('MapGrid — trajetos com geometria nativa', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
    await garantirColecaoDeTrajetos();
  });

  test.beforeEach(async ({ page }) => {
    await garantirMapGridDosTrajetos();
    await login(page);
    await page.goto(`/admin/content/${COLECAO_DE_TRAJETOS}`);
    await esperarOMapGrid(page);
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  });

  test('clicar na linha de um LineString enquadra o trajeto inteiro, e não o primeiro vértice', async ({
    page,
  }) => {
    await linhaDe(page, 'Rio → São Paulo').click();

    await expect
      .poll(
        async () => {
          const visivel = await areaVisivel();
          return visivel !== null && contem(visivel, RIO_SAO_PAULO) && visivel[2] - visivel[0] < 15;
        },
        { timeout: 30_000 }
      )
      .toBe(true);
  });

  test.fixme('reenquadrar com geometria nativa volta à coleção inteira na hora', async ({
    page,
  }) => {
    await linhaDe(page, 'Rio → São Paulo').click();
    await expect
      .poll(
        async () => {
          const visivel = await areaVisivel();
          return visivel !== null && !contem(visivel, COLECAO_INTEIRA);
        },
        { timeout: 30_000 }
      )
      .toBe(true);

    await page.locator('.reset-map-btn').click();

    await expect
      .poll(
        async () => {
          const visivel = await areaVisivel();
          return visivel !== null && contem(visivel, COLECAO_INTEIRA);
        },
        { timeout: 30_000 }
      )
      .toBe(true);
  });

  test.fixme('clicar numa linha cujo trajeto está fora da tela leva o mapa até ele', async ({
    page,
  }) => {
    // com geometria nativa o Directus só busca o que cai na área visível
    await linhaDe(page, 'Rio → São Paulo').click();
    await expect
      .poll(
        async () => {
          const visivel = await areaVisivel();
          return visivel !== null && !contem(visivel, MANAUS_BELEM);
        },
        { timeout: 30_000 }
      )
      .toBe(true);

    await linhaDe(page, 'Manaus → Belém').click();

    await expect
      .poll(
        async () => {
          const visivel = await areaVisivel();
          return visivel !== null && contem(visivel, MANAUS_BELEM);
        },
        { timeout: 30_000 }
      )
      .toBe(true);
  });
});
