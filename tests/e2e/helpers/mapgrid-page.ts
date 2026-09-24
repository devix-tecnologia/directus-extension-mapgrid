/**
 * As âncoras de DOM do MapGrid, num lugar só.
 *
 * Depois da task-010 quem desenha são os layouts do Directus, e não os nossos
 * componentes: `.map-container`, `.v-table`, `[data-sort-desc]` e
 * `[data-remove-field]` deixaram de existir. Três specs repetiam esses
 * seletores, e os três passaram a esperar por uma tela que não existe mais.
 *
 * O que continua nosso são os dois painéis da composição — `.mapgrid-pane--map`
 * e `.mapgrid-pane--grid` — e é por eles que tudo aqui começa. Dentro deles, o
 * que se procura é a classe do layout do Directus (`.layout-map`,
 * `.layout-tabular`), nunca um detalhe interno do `v-table`.
 */
import { expect, type Page } from '@playwright/test';
import { COLLECTION_NAME } from '../../helper-collection';
import { testEnv } from '../../test-env';

/** O painel de cada layout embutido. Nossos, e os únicos que são. */
export const PAINEL_MAPA = '.mapgrid-pane--map';
export const PAINEL_GRADE = '.mapgrid-pane--grid';

/** O layout do Directus dentro de cada painel. */
export const MAPA = `${PAINEL_MAPA} .layout-map`;
export const GRADE = `${PAINEL_GRADE} .layout-tabular`;

/** A tabela desenhada pela grade, e as partes dela que os specs consultam. */
export const TABELA = `${PAINEL_GRADE} table`;
export const CABECALHOS = `${PAINEL_GRADE} thead th`;
export const LINHAS = `${PAINEL_GRADE} tbody tr`;

/** O `+` que abre o seletor de campos, no cabeçalho do layout tabular deles. */
export const ADICIONAR_CAMPO = `${PAINEL_GRADE} thead .add-field`;

/** O canvas do MapLibre, que é onde os marcadores são desenhados. */
export const CANVAS_DO_MAPA = `${PAINEL_MAPA} .maplibregl-canvas`;

const CARREGAMENTO = 60_000;

export async function login(page: Page): Promise<void> {
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
 * Espera a composição estar de pé. Esperar só pelo mapa não basta: ele aparece
 * antes da grade, e um spec de coluna mediria o cabeçalho antes de ele existir.
 */
export async function esperarOMapGrid(page: Page): Promise<void> {
  await expect(page.locator(MAPA)).toBeVisible({ timeout: CARREGAMENTO });
  await expect(page.locator(TABELA)).toBeVisible({ timeout: CARREGAMENTO });
}

export async function openCollection(page: Page, collection = COLLECTION_NAME): Promise<void> {
  await page.goto(`/admin/content/${collection}`);
  await esperarOMapGrid(page);
}

/**
 * As colunas de dados que a grade mostra, na ordem.
 *
 * Os rótulos vêm do `name` do campo, que o Directus deriva da chave: o campo
 * `name` aparece como "Name". Por isso a comparação é em minúsculas — o que o
 * teste afirma é qual campo está na tela, não como ele foi capitalizado. As
 * células vazias são a da caixa de marcação e a do `+`, que não são campos.
 */
export async function colunasVisiveis(page: Page): Promise<string[]> {
  const cabecalhos = page.locator(CABECALHOS);
  await expect(cabecalhos.first()).toBeVisible({ timeout: 30_000 });

  const rotulos = await cabecalhos.allInnerTexts();
  return rotulos.map((rotulo) => rotulo.trim().toLowerCase()).filter((rotulo) => rotulo !== '');
}

/**
 * A célula da primeira linha sob uma coluna, achada pela posição do cabeçalho.
 *
 * Contar colunas na mão não serve: a tabela deles começa com a caixa de
 * marcação e pode ganhar a alça de ordenação manual quando a coleção tem campo
 * de `sort`. Como essas colunas aparecem no `thead` também, a posição do
 * rótulo é a posição da célula.
 */
export async function celulaDaColuna(page: Page, campo: string) {
  const rotulos = await page.locator(CABECALHOS).allInnerTexts();
  const indice = rotulos.findIndex((rotulo) => rotulo.trim().toLowerCase() === campo.toLowerCase());
  if (indice === -1)
    throw new Error(`A coluna "${campo}" não está na grade: ${rotulos.join(', ')}`);

  return page.locator(LINHAS).first().locator('td').nth(indice);
}

/**
 * Ordena por uma coluna pelo caminho que o layout tabular do Directus oferece:
 * o clique no cabeçalho abre o menu de contexto, e ordenar está dentro dele.
 * Não é escolha nossa — o `v-table` troca o clique que ordena por abrir o menu
 * assim que o slot `header-context-menu` existe, e eles usam esse slot.
 */
export async function ordenarPor(
  page: Page,
  campo: string,
  direcao: 'asc' | 'desc'
): Promise<void> {
  await page
    .locator(CABECALHOS, { hasText: new RegExp(`^${campo}$`, 'i') })
    .first()
    .click();

  const item =
    direcao === 'desc'
      ? page.getByText(/sort descending|ordem decrescente/i).first()
      : page.getByText(/sort ascending|ordem crescente/i).first();

  await expect(item).toBeVisible({ timeout: 20_000 });
  await item.click();
}

/** A linha da grade que fala de um item, achada pelo texto de uma célula. */
export function linhaDe(page: Page, texto: string) {
  return page.locator(LINHAS, { hasText: texto }).first();
}

/**
 * Clica no marcador que está no centro do canvas do mapa.
 *
 * Duas coisas, e as duas precisam ser assim. Achar um marcador numa tela de
 * MapLibre exige saber onde a câmera está, e a instância do mapa é do layout do
 * Directus — de fora não se alcança; quem diz de onde a câmera parte é o preset
 * semeado, e aí o ponto semeado nasce no centro.
 *
 * E esperar o canvas aparecer não basta: a camada de pontos desenha depois, e
 * um clique antes disso cai no vazio — foi o que fez este spec falhar com o
 * marcador na tela da captura. O sinal de que há ponto sob o mouse é o cursor
 * do canvas virar `pointer`, que o próprio MapLibre troca ao entrar numa
 * camada interativa. Medido: leva ~2s depois de a grade aparecer.
 */
export async function clicarNoPontoCentral(page: Page): Promise<void> {
  const canvas = page.locator(CANVAS_DO_MAPA);
  await expect(canvas).toBeVisible({ timeout: CARREGAMENTO });

  const caixa = await canvas.boundingBox();
  if (!caixa) throw new Error('O canvas do mapa não tem caixa delimitadora');

  const x = caixa.x + caixa.width / 2;
  const y = caixa.y + caixa.height / 2;

  await expect
    .poll(
      async () => {
        // o cursor so muda com movimento: dois pontos, para haver `mousemove`
        await page.mouse.move(x + 1, y);
        await page.mouse.move(x, y);
        return canvas.evaluate((elemento) => getComputedStyle(elemento).cursor);
      },
      { timeout: 30_000 }
    )
    .toBe('pointer');

  await page.mouse.click(x, y);
}
