import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { DIRETORIO_DE_EVIDENCIAS, nomeDeEvidencia } from '../../scripts/captura-de-tela/index';
import { esperarOMapGrid, linhaDe } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPresetCentradoEm } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * A evidência do enquadramento pelo clique na linha, em vídeo.
 *
 * O que a task-010 muda aqui é movimento: clicar numa linha leva o mapa até o
 * item. Uma imagem parada não distingue "o mapa voou até lá" de "o mapa já
 * estava lá", então a evidência é um vídeo. O "antes" mostra o mapa parado
 * enquanto as linhas são clicadas — o componente de mapa do Directus ignorava a
 * câmera escrita depois de montado; o "depois" mostra o voo, feito pelo
 * `CentralizadorDoMapaDirectus`.
 *
 * São dois vídeos, um por valor de `zoomOnClick`: desligado, o mapa centraliza
 * mantendo o zoom de cidade — é o caso da navegação entre leituras de placa
 * (task-381 do geohub); ligado, aproxima até o `maxZoom` do Directus.
 *
 * O nome segue a convenção das capturas (`nomeDeEvidencia`), com `.webm` no
 * lugar de `.png`, para o par aparecer lado a lado em `TASKS/assets/`.
 */

const BRASILIA: [number, number] = [-47.9292, -15.7801];
const ZOOM_DE_CIDADE = 9;
const PERCURSO = ['Manaus', 'Recife', 'Curitiba'];
const TELA = { width: 1600, height: 900 };

const CASOS = [
  { rotulo: 'enquadramento-mantendo-o-zoom', zoomOnClick: false },
  { rotulo: 'enquadramento-aproximando', zoomOnClick: true },
];

const evidencia = (rotulo: string): string | undefined => {
  const momento = process.env.EVIDENCE_MOMENT;
  const task = process.env.EVIDENCE_TASK;
  if (!momento || !task) return undefined;
  if (momento !== 'antes' && momento !== 'depois') {
    throw new Error(
      `EVIDENCE_MOMENT deve ser "antes" ou "depois", e veio ${JSON.stringify(momento)}`
    );
  }
  const png = nomeDeEvidencia({ momento, rotulo, task });
  return `${DIRETORIO_DE_EVIDENCIAS}/${png.replace(/\.png$/, '.webm')}`;
};

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

for (const { rotulo, zoomOnClick } of CASOS) {
  test(`grava o vídeo do clique na linha — ${rotulo}`, async ({ browser }) => {
    const caminho = evidencia(rotulo);
    test.skip(!caminho, 'só roda quando a evidência é pedida por EVIDENCE_TASK/EVIDENCE_MOMENT');
    if (!caminho) return;

    await setupTestEnvironment();
    // zoom de cidade sobre Brasília: dali, qualquer outra capital está fora da tela
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

    for (const cidade of PERCURSO) {
      const linha = linhaDe(page, cidade);
      await expect(linha).toBeVisible({ timeout: 30_000 });
      await linha.click();
      // o fitBounds do Directus voa com speed 1.3: tempo de a animação terminar
      await page.waitForTimeout(4_000);
    }

    const video = page.video();
    await contexto.close();
    const gravado = await video?.path();
    if (!gravado) throw new Error('O Playwright não entregou o vídeo gravado');

    mkdirSync(dirname(caminho), { recursive: true });
    copyFileSync(gravado, caminho);
  });
}
