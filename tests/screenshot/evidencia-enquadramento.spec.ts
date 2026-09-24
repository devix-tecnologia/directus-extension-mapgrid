import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { DIRETORIO_DE_EVIDENCIAS, nomeDeEvidencia } from '../../scripts/captura-de-tela/index';
import { esperarOMapGrid, linhaDe } from '../e2e/helpers/mapgrid-page';
import { COLLECTION_NAME } from '../helper-collection';
import { ensureMapGridPresetCentradoEm } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { testEnv } from '../test-env';

/**
 * A evidência do enquadramento pelo clique na linha, em tira de quadros.
 *
 * O que a task-010 muda aqui é movimento: clicar numa linha leva o mapa até o
 * item. Uma captura só não distingue "o mapa voou até lá" de "já estava lá",
 * então a evidência é uma sequência: o painel do mapa fotografado parado em
 * Brasília e depois de cada clique, lado a lado. O "antes" mostra quatro vezes
 * Brasília — o componente de mapa do Directus ignorava a câmera escrita depois
 * de montado; o "depois" mostra as quatro capitais, pelo
 * `CentralizadorDoMapaDirectus`.
 *
 * Tira, e não vídeo nem GIF, por causa do teto de 300 KB por arquivo em
 * `TASKS/assets` (`scripts/tamanho-de-evidencia`): o vídeo desta mesma
 * sequência pesa 2 MB, a tira fica perto de 50 KB. O vídeo continua sendo
 * gravado, em `test-results/video-evidencia/`, para quem precisar ver o voo.
 *
 * São dois casos, um por valor de `zoomOnClick`: desligado, o mapa centraliza
 * mantendo o zoom de cidade — é o caso da navegação entre leituras de placa
 * (task-381 do geohub); ligado, aproxima até o `maxZoom` do Directus.
 *
 * O nome segue a convenção das capturas (`nomeDeEvidencia`), com `.jpg` no
 * lugar de `.png`.
 */

const BRASILIA: [number, number] = [-47.9292, -15.7801];
const ZOOM_DE_CIDADE = 9;
const PERCURSO = ['Manaus', 'Recife', 'Curitiba'];
const TELA = { width: 1600, height: 900 };
/** Largura de cada quadro na tira: quatro lado a lado cabem numa tela comum. */
const LARGURA_DO_QUADRO = 360;
const QUALIDADE_DO_JPEG = 70;

const INTERVALO_ENTRE_FOTOS_MS = 500;
const PRAZO_PARA_O_MAPA_PARAR_MS = 20_000;

const fotografarOMapa = (page: Page): Promise<Buffer> =>
  page.locator('.mapgrid-pane--map').screenshot({ quality: QUALIDADE_DO_JPEG, type: 'jpeg' });

/**
 * O painel do mapa quando ele para: duas fotos seguidas iguais. Tempo fixo não
 * serve — o voo do `fitBounds` do Directus dura mais de 4 s quando aproxima de
 * zoom 9 a 14, e os tiles do destino ainda chegam depois dele (medido: com
 * espera de 4 s, o quadro saía no meio do voo, borrado).
 */
async function fotografarOMapaParado(page: Page): Promise<Buffer> {
  const prazo = Date.now() + PRAZO_PARA_O_MAPA_PARAR_MS;
  let anterior = await fotografarOMapa(page);
  while (Date.now() < prazo) {
    await page.waitForTimeout(INTERVALO_ENTRE_FOTOS_MS);
    const atual = await fotografarOMapa(page);
    if (atual.equals(anterior)) return atual;
    anterior = atual;
  }
  throw new Error(`O mapa não parou em ${PRAZO_PARA_O_MAPA_PARAR_MS / 1000} s`);
}

/**
 * Junta os quadros numa tira, desenhada numa página em branco do próprio
 * navegador — sem depender de ferramenta de imagem no container.
 */
async function montarTira(page: Page, quadros: Buffer[]): Promise<Buffer> {
  const imagens = quadros
    .map((q) => `<img src="data:image/jpeg;base64,${q.toString('base64')}">`)
    .join('');
  // inline-flex com align-items: flex-start — sem isso o flex estica cada
  // quadro até a altura da página, e a tira sai deformada
  await page.setContent(
    `<style>body{margin:0;background:#fff}` +
      `#tira{display:inline-flex;align-items:flex-start;gap:4px}` +
      `img{width:${LARGURA_DO_QUADRO}px;height:auto;flex:none}</style>` +
      `<div id="tira">${imagens}</div>`
  );
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  return page.locator('#tira').screenshot({ quality: QUALIDADE_DO_JPEG, type: 'jpeg' });
}

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
  return `${DIRETORIO_DE_EVIDENCIAS}/${png.replace(/\.png$/, '.jpg')}`;
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

    const quadros = [await fotografarOMapaParado(page)];
    for (const cidade of PERCURSO) {
      const linha = linhaDe(page, cidade);
      await expect(linha).toBeVisible({ timeout: 30_000 });
      await linha.click();
      // dá tempo de o voo começar antes de procurar o mapa parado
      await page.waitForTimeout(1_000);
      quadros.push(await fotografarOMapaParado(page));
    }

    // A evidência não pode mentir: um "depois" em que o mapa não saiu do lugar
    // é falha, não imagem. Aconteceu — o load do MapLibre às vezes atrasa além
    // do prazo do centralizador, e a tira saía com quatro Brasílias.
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
