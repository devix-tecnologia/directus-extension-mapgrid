import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import { esperarOMapGrid, linhaDe, login } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPresetCentradoEm } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { caminhoDaEvidencia, fotografarOMapaParado, montarTira } from './helpers/tira-de-quadros';

const BRASILIA: [number, number] = [-47.9292, -15.7801];
const ZOOM_DE_CIDADE = 9;
const PERCURSO = ['Manaus', 'Recife', 'Curitiba'];
const TELA = { width: 1600, height: 900 };

const CASOS = [
  { rotulo: 'enquadramento-mantendo-o-zoom', zoomOnClick: false },
  { rotulo: 'enquadramento-aproximando', zoomOnClick: true },
];

for (const { rotulo, zoomOnClick } of CASOS) {
  test(`grava o vídeo do clique na linha — ${rotulo}`, async ({ browser }) => {
    const caminho = caminhoDaEvidencia(rotulo);
    test.skip(!caminho, 'só roda quando a evidência é pedida por EVIDENCE_TASK/EVIDENCE_MOMENT');
    if (!caminho) return;

    await setupTestEnvironment();
    await ensureMapGridPresetCentradoEm(BRASILIA, ZOOM_DE_CIDADE, COLLECTION_NAME, { zoomOnClick });

    const contexto = await browser.newContext({
      recordVideo: { dir: 'test-results/video-evidencia', size: TELA },
      viewport: TELA,
    });
    const page = await contexto.newPage();

    await login(page);
    await page.goto(`/admin/content/${COLLECTION_NAME}`);
    await esperarOMapGrid(page);
    await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2_000);

    const quadros = [await fotografarOMapaParado(page)];
    for (const cidade of PERCURSO) {
      const linha = linhaDe(page, cidade);
      await expect(linha).toBeVisible({ timeout: 30_000 });
      await linha.click();
      await page.waitForTimeout(1_000);
      quadros.push(await fotografarOMapaParado(page));
    }

    if (process.env.EVIDENCE_MOMENT === 'depois') {
      for (let i = 1; i < quadros.length; i++) {
        expect(
          quadros[i]?.equals(quadros[i - 1] as Buffer),
          `o mapa não se moveu para ${PERCURSO[i - 1]}`
        ).toBe(false);
      }
    }

    const tira = await montarTira(await contexto.newPage(), quadros);
    await contexto.close();

    mkdirSync(dirname(caminho), { recursive: true });
    writeFileSync(caminho, tira);
  });
}
