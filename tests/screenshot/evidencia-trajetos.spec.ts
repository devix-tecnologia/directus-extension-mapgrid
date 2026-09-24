import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test } from '@playwright/test';
import { CANVAS_DO_MAPA, esperarOMapGrid, linhaDe, login } from '../e2e/helpers/mapgrid-page';
import {
  COLECAO_DE_TRAJETOS,
  garantirColecaoDeTrajetos,
  garantirMapGridDosTrajetos,
} from '../helpers/colecao-de-trajetos';
import { setupTestEnvironment } from '../setup';
import { caminhoDaEvidencia, fotografarOMapaParado, montarTira } from './helpers/tira-de-quadros';

/**
 * A evidência da task-012, que é sobre o mapa voltar a se mover.
 *
 * Nenhum elemento novo aparece na tela: o que mudou é que a composição deixou
 * de congelar depois da primeira busca filtrada pela área visível. Uma captura
 * parada mostraria o mapa-múndi nos dois momentos, e o "antes" seria idêntico
 * ao primeiro quadro do "depois" — evidência nenhuma. A tira mostra o percurso:
 * mundo inteiro, Rio–São Paulo, e então Manaus–Belém, que é o trajeto **fora da
 * tela**, o caminho que depende de buscar a geometria na API.
 *
 * Fica sobre a coleção de trajetos, e não sobre a do README, porque o defeito
 * só existe com geometria nativa do PostGIS: é ela que faz o Directus filtrar a
 * busca pelo `bbox` da câmera e recontar os itens a cada voo.
 */

const TELA = { height: 900, width: 1600 };
const PERCURSO = ['Rio → São Paulo', 'Manaus → Belém'];

test('grava a tira do clique na linha com geometria nativa', async ({ browser }) => {
  const caminho = caminhoDaEvidencia('trajetos-geometria-nativa');
  test.skip(!caminho, 'só roda quando a evidência é pedida por EVIDENCE_TASK/EVIDENCE_MOMENT');
  if (!caminho) return;

  await setupTestEnvironment();
  await garantirColecaoDeTrajetos();
  await garantirMapGridDosTrajetos();

  const contexto = await browser.newContext({ viewport: TELA });
  const page = await contexto.newPage();

  await login(page);
  await page.goto(`/admin/content/${COLECAO_DE_TRAJETOS}`);
  await esperarOMapGrid(page);
  await expect(page.locator(CANVAS_DO_MAPA)).toBeVisible({ timeout: 30_000 });

  const quadros = [await fotografarOMapaParado(page)];
  for (const trajeto of PERCURSO) {
    const linha = linhaDe(page, trajeto);
    await expect(linha).toBeVisible({ timeout: 30_000 });
    await linha.click();
    quadros.push(await fotografarOMapaParado(page));
  }

  /*
   * Dois quadros idênticos não são evidência, são a mesma tela fotografada duas
   * vezes — e era exatamente isso que o defeito produzia. A conferência só vale
   * no "depois": no "antes" o mapa não se mexe mesmo, e é esse o ponto.
   */
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
