/**
 * A tira de quadros parados: a forma de evidência para mudanças que só existem
 * em movimento.
 *
 * Um voo do mapa não cabe numa captura só — "o mapa foi até o trajeto" precisa
 * do antes e do depois lado a lado. O vídeo mostraria, mas não se anexa a um
 * documento de task e ninguém compara dois vídeos. A tira resolve: um quadro
 * por parada, na ordem, num JPEG só.
 */
import type { Page } from '@playwright/test';
import { DIRETORIO_DE_EVIDENCIAS, nomeDeEvidencia } from '../../../scripts/captura-de-tela/index';
import { PAINEL_MAPA } from '../../e2e/helpers/mapgrid-page';

const LARGURA_DO_QUADRO = 360;
const QUALIDADE_DO_JPEG = 70;
const INTERVALO_ENTRE_FOTOS_MS = 500;
const PRAZO_PARA_O_MAPA_PARAR_MS = 20_000;

const fotografarOMapa = (page: Page): Promise<Buffer> =>
  page.locator(PAINEL_MAPA).screenshot({ quality: QUALIDADE_DO_JPEG, type: 'jpeg' });

/**
 * Fotografa o painel do mapa quando ele para de mudar.
 *
 * Duas fotos iguais em sequência é o sinal de parada: o voo do MapLibre não
 * emite nada que o Playwright saiba esperar, e um `waitForTimeout` fixo ora
 * fotografa o meio do voo, ora perde tempo à toa.
 */
export async function fotografarOMapaParado(page: Page): Promise<Buffer> {
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

/** Junta os quadros numa imagem só, na ordem em que foram tirados. */
export async function montarTira(page: Page, quadros: Buffer[]): Promise<Buffer> {
  const imagens = quadros
    .map((q) => `<img src="data:image/jpeg;base64,${q.toString('base64')}">`)
    .join('');
  // sem align-items: flex-start o flex estica os quadros até a altura da página
  await page.setContent(
    `<style>body{margin:0;background:#fff}` +
      `#tira{display:inline-flex;align-items:flex-start;gap:4px}` +
      `img{width:${LARGURA_DO_QUADRO}px;height:auto;flex:none}</style>` +
      `<div id="tira">${imagens}</div>`
  );
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  return page.locator('#tira').screenshot({ quality: QUALIDADE_DO_JPEG, type: 'jpeg' });
}

/**
 * O caminho do arquivo de evidência, ou `undefined` quando ninguém pediu.
 *
 * O rótulo é do roteiro, e não do `EVIDENCE_LABEL` do ambiente: dois roteiros
 * honrando a mesma variável escrevem no MESMO arquivo, e o segundo apaga o
 * primeiro sem erro nenhum. Já aconteceu nesta pasta.
 */
export function caminhoDaEvidencia(rotulo: string): string | undefined {
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
}
