import { expect, type Page, test } from '@playwright/test';
import { DIRETORIO_DE_EVIDENCIAS, nomeDeEvidencia } from '../../scripts/captura-de-tela/index';
import { esperarOMapGrid } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { apiRequest } from '../helpers/directus-api';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * Regenerates the screenshot the README shows at the top (`docs/tela.jpg`).
 *
 * It exists so that refreshing the image is a command and not a chore: the
 * project requires the screenshot to be updated whenever a component changes
 * how it looks, and an image that has to be produced by hand is an image that
 * silently goes stale — which is exactly what happened when the options panel
 * lost its five numbered column selects.
 */

/*
 * Wide on purpose. Below roughly 1200px Directus turns the right sidebar into an
 * overlay drawer that dims the content behind it, so a narrower shot hides the
 * very thing it is meant to show.
 */
const VIEWPORT = { width: 1600, height: 900 };

/**
 * A mesma captura também vira evidência de task, quando pedida.
 *
 * A convenção de nome vem do geohub: `TASKS/assets/task-NNN-<rotulo>-<momento>.png`,
 * com o momento no nome e não em subpasta, para que o par antes/depois apareça
 * lado a lado ao abrir a pasta.
 *
 * O "antes" se obtém rodando este mesmo roteiro contra o `dist/index.js`
 * construído de uma revisão anterior: as duas imagens saem então do mesmo
 * ambiente, mesma coleção e mesmo viewport, e a única diferença entre elas é a
 * extensão. Capturar o "antes" depois da mudança seria tarde demais — só o git
 * ainda tem aquele estado.
 */
const evidencia = (): string | undefined => {
  const momento = process.env.EVIDENCE_MOMENT;
  const task = process.env.EVIDENCE_TASK;
  if (!momento || !task) return undefined;

  if (momento !== 'antes' && momento !== 'depois') {
    throw new Error(
      `EVIDENCE_MOMENT deve ser "antes" ou "depois", e veio ${JSON.stringify(momento)}`
    );
  }

  return `${DIRETORIO_DE_EVIDENCIAS}/${nomeDeEvidencia({
    task,
    rotulo: process.env.EVIDENCE_LABEL ?? 'tela',
    momento,
  })}`;
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

/**
 * Opens the layout options panel, so the shot shows how the layout is
 * configured. The section it expands is the popup template — the columns used
 * to live here, and moving them to the grid header left this panel with only
 * collection configuration.
 */
async function openLayoutOptions(page: Page): Promise<void> {
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();

  const popup = page.getByText(/popup pin map|popup do marcador/i).first();
  await expect(popup).toBeVisible({ timeout: 30_000 });
  await popup.click();
}

test('captures the README screenshot', async ({ page }) => {
  await setupTestEnvironment();

  // the shot should show the layout doing its job, so the preset names the
  // geolocation field, a popup template and a few columns
  await ensureMapGridPreset();
  await apiRequest('POST', '/presets', {
    collection: COLLECTION_NAME,
    layout: 'mapgrid',
    // as colunas moram na consulta, e nao nas opcoes: e onde o Directus as
    // guarda, e e de la que a grade as le desde a task-005
    layout_query: { mapgrid: { page: 1, limit: 25, sort: ['name'], fields: ['name', 'status'] } },
    layout_options: {
      mapgrid: {
        geolocation: 'location',
        title: '{{name}}',
        zoomOnClick: false,
      },
    },
  });

  await page.setViewportSize(VIEWPORT);
  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await esperarOMapGrid(page);

  await openLayoutOptions(page);

  // let the map settle: tiles, clustering and the initial framing all animate
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(6_000);

  await page.screenshot({
    path: 'docs/tela.jpg',
    type: 'jpeg',
    quality: 90,
    animations: 'disabled',
  });

  const caminhoDaEvidencia = evidencia();
  if (caminhoDaEvidencia) {
    await page.screenshot({ path: caminhoDaEvidencia, animations: 'disabled' });
  }
});
