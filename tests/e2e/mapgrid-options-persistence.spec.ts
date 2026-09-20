/**
 * O painel de opções grava no preset?
 *
 * A task-009 concluiu que não, mas a medição que sustentava essa conclusão lia a
 * primeira linha de `/presets` da coleção — que é a global, escrita pela
 * semente. O Directus não edita a global quando alguém muda uma opção pela
 * interface: ele cria um preset só daquela pessoa. O ajudante foi corrigido em
 * `tests/helpers/mapgrid-preset.ts` para aplicar a mesma precedência do Directus
 * (pessoa > papel > global), e esta é a medição refeita.
 *
 * Se passar, o defeito da task-009 era erro de medição.
 */
import { expect, type Page, test } from '@playwright/test';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPreset, readMapGridPresetOptions } from '../helpers/mapgrid-preset';
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

/** A barra lateral vem recolhida, e as opções do layout só existem no DOM depois. */
async function openLayoutOptions(page: Page): Promise<void> {
  const header = page.getByRole('button', { name: /^layers/ });
  await expect(header).toBeVisible({ timeout: 30_000 });
  if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();

  const section = page.getByText(/zoom on table click|zoom ao clicar na linha/i).first();
  await expect(section).toBeVisible({ timeout: 30_000 });
  await section.click();
}

test.beforeAll(async () => {
  await setupTestEnvironment();
});

// dois carregamentos completos, e o mapa e lento: o padrao de 180s nao cobre
test.setTimeout(300_000);

test('uma opção mudada no painel sobrevive ao reload', async ({ page }) => {
  await ensureMapGridPreset();
  await login(page);

  await page.goto(`/admin/content/${COLLECTION_NAME}`);
  await expect(page.locator('.map-container')).toBeVisible({ timeout: 60_000 });

  const antes = await readMapGridPresetOptions();
  console.log(`[antes] layout_options efetivo: ${JSON.stringify(antes)}`);

  await openLayoutOptions(page);

  const checkbox = page.getByText(/zoom when clicking|aproximar ao clicar/i).first();
  await expect(checkbox).toBeVisible({ timeout: 30_000 });
  const alvo = !(antes.zoomOnClick ?? false);
  await checkbox.click();

  /*
   * A gravação do Directus é debounced: ler logo após o clique chega antes de
   * ela acontecer, e o teste acusaria perda do que só ainda não foi gravado.
   */
  await expect
    .poll(async () => (await readMapGridPresetOptions()).zoomOnClick, { timeout: 20_000 })
    .toBe(alvo);

  const depois = await readMapGridPresetOptions();
  console.log(`[depois] layout_options efetivo: ${JSON.stringify(depois)}`);

  /*
   * O reload nao e para reler a tela — o valor ja esta no banco. E para provar
   * que montar o layout de novo nao sobrescreve a escolha com o padrao
   * detectado, que e o risco real neste caminho.
   */
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(15_000);

  const apos = await readMapGridPresetOptions();
  console.log(`[apos reload] layout_options efetivo: ${JSON.stringify(apos)}`);
  expect(apos.zoomOnClick).toBe(alvo);
});
