import { expect, type Page, test } from '@playwright/test';
import { DIRETORIO_DE_EVIDENCIAS, nomeDeEvidencia } from '../../scripts/captura-de-tela/index';
import { clicarNoPontoCentral, esperarOMapGrid } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPresetCentradoEm } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * A evidência do clique no ponto, que nenhuma captura parada mostra.
 *
 * A mudança da task-010 não acrescenta elemento nenhum à tela: ela troca o que
 * um clique no marcador faz. Antes, o `handleClick` do layout de mapa do
 * Directus levava para a tela do item — a evidência "antes" é uma página que
 * nem é o MapGrid. Depois, a pessoa continua no layout e a linha do item
 * aparece marcada na grade. Só um par antes/depois com o clique já dado deixa
 * isso julgável.
 *
 * Fica fora do `readme-screenshot.spec.ts` de propósito: aquele produz a imagem
 * do topo do README, que precisa mostrar o layout em repouso.
 */

const MANAUS: [number, number] = [-60.0255, -3.119];
const ZOOM_DE_CIDADE = 12;

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
    rotulo: process.env.EVIDENCE_LABEL ?? 'clique-no-ponto',
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

test('captura a tela depois do clique num marcador', async ({ page }) => {
  const caminho = evidencia();
  test.skip(!caminho, 'só roda quando a evidência é pedida por EVIDENCE_TASK/EVIDENCE_MOMENT');
  if (!caminho) return;

  await setupTestEnvironment();

  // a camera semeada poe Manaus no centro do canvas: e o que da alvo ao clique
  await ensureMapGridPresetCentradoEm(MANAUS, ZOOM_DE_CIDADE);

  await login(page);
  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await esperarOMapGrid(page);

  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 30_000 });
  await clicarNoPontoCentral(page);
  await page.waitForTimeout(3_000);

  await page.screenshot({ path: caminho, animations: 'disabled' });
});
