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
import { ensureMapGridPreset, readMapGridPresetOptions } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import {
  abrirOpcoesDoLayout,
  abrirSecaoDasOpcoes,
  escolherNoSeletor,
  login,
  OPCOES_DA_GRADE,
  OPCOES_DO_MAPA,
  OPCOES_DO_ZOOM,
  openCollection,
} from './helpers/mapgrid-page';

/** A barra lateral vem recolhida, e as opções do layout só existem no DOM depois. */
async function openLayoutOptions(page: Page): Promise<void> {
  await abrirOpcoesDoLayout(page);
  await abrirSecaoDasOpcoes(page, OPCOES_DO_ZOOM);
}

/** As seções do preset que cada layout embutido escreve. */
const secao = (opcoes: Record<string, unknown>, nome: 'map' | 'tabular') =>
  (opcoes[nome] ?? {}) as Record<string, unknown>;

test.beforeAll(async () => {
  await setupTestEnvironment();
});

// dois carregamentos completos, e o mapa e lento: o padrao de 180s nao cobre
test.setTimeout(300_000);

test('uma opção mudada no painel sobrevive ao reload', async ({ page }) => {
  await ensureMapGridPreset();
  await login(page);

  await openCollection(page);

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

/**
 * A regressão que a task-010 pede: uma opção de CADA layout embutido, gravada
 * pelo painel, presente no preset efetivo depois de um reload.
 *
 * O que ela alcança e a do `zoomOnClick` não: `layoutOptions.map` e
 * `layoutOptions.tabular` são duas seções do mesmo objeto, e cada layout
 * escreve o objeto inteiro para trocar uma chave. Mexer numa opção só nunca
 * provaria que a outra seção sobreviveu — ela nem existia no preset.
 *
 * Os dois controles não foram escolhidos por gosto, e sim por serem os únicos
 * dos dois painéis que gravam e dão para mudar aqui:
 *
 * - da grade, "Spacing" é o painel inteiro deles, e `cozy` é o padrão, então
 *   `comfortable` é mudança de verdade;
 * - do mapa, "Basemap" mora no store do app e não no preset; "Geospatial Field"
 *   só tem um item nesta coleção, que já é o escolhido; e "Cluster Nearby Data"
 *   nasce desabilitada, porque o campo `location` da semente é `json` sem
 *   `geometryType` e eles desabilitam a caixa quando o tipo não é `Point`.
 *   Sobra o template de exibição, preenchido pelo menu de campos deles.
 */
async function escolherCampoNoTemplate(page: Page, campo: RegExp): Promise<void> {
  /*
   * Pelo papel, e não pela classe: o `add_box` é o botão que abre o menu de
   * campos do controle de template deles, e a classe `.system-display-template`
   * que o pacote declara não chega ao DOM que o Playwright vê.
   */
  const abrirCampos = page.locator(OPCOES_DO_MAPA).getByRole('button', { name: 'add_box' });
  await expect(abrirCampos).toBeVisible({ timeout: 30_000 });
  await abrirCampos.click();

  const item = page.getByRole('listitem').filter({ hasText: campo }).first();
  await expect(item).toBeVisible({ timeout: 30_000 });
  await item.click();
}

test('as opções dos dois layouts embutidos sobrevivem juntas ao reload', async ({ page }) => {
  await ensureMapGridPreset();
  await login(page);
  await openCollection(page);

  await abrirOpcoesDoLayout(page);

  await abrirSecaoDasOpcoes(page, OPCOES_DA_GRADE);
  await escolherNoSeletor(page, OPCOES_DA_GRADE, /comfortable|confortável/i);

  await abrirSecaoDasOpcoes(page, OPCOES_DO_MAPA);
  await escolherCampoNoTemplate(page, /^\s*name\s*$/i);

  /* A gravação do Directus é debounced: ler logo depois do clique chega antes. */
  await expect
    .poll(async () => secao(await readMapGridPresetOptions(), 'tabular').spacing, {
      timeout: 30_000,
    })
    .toBe('comfortable');

  await expect
    .poll(async () => secao(await readMapGridPresetOptions(), 'map').displayTemplate, {
      timeout: 30_000,
    })
    .toBeTruthy();

  const antes = await readMapGridPresetOptions();
  console.log(`[antes do reload] layout_options efetivo: ${JSON.stringify(antes)}`);

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(15_000);

  const apos = await readMapGridPresetOptions();
  console.log(`[apos reload] layout_options efetivo: ${JSON.stringify(apos)}`);

  /*
   * As três juntas, e é a soma que importa: a da grade, a do mapa e a da
   * composição. Se qualquer escrita apagar o objeto inteiro em vez de trocar a
   * própria seção, uma destas some.
   */
  expect(secao(apos, 'tabular').spacing).toBe('comfortable');
  expect(secao(apos, 'map').displayTemplate).toBe(secao(antes, 'map').displayTemplate);
  expect(apos.zoomOnClick).toBe(true);
});
