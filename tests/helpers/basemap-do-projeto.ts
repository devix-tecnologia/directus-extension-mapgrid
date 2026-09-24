import type { Page } from '@playwright/test';
import { apiRequest } from './directus-api';

export const BASEMAP_DE_TESTE = 'Mapa de teste do MapGrid';
export const ATRIBUICAO_DE_TESTE = '© Tiles de teste do MapGrid';
const HOST_DOS_TILES = 'https://tiles.mapgrid.test';

/** PNG de 1×1: o bastante para o MapLibre decodificar o tile. */
const TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

/** Um basemap raster no Project Settings, servido por um host que o teste intercepta. */
export async function configurarBasemapDoProjeto(): Promise<void> {
  await apiRequest('PATCH', '/settings', {
    basemaps: [
      {
        attribution: ATRIBUICAO_DE_TESTE,
        name: BASEMAP_DE_TESTE,
        tileSize: 256,
        type: 'raster',
        url: `${HOST_DOS_TILES}/{z}/{x}/{y}.png`,
      },
    ],
  });
}

export async function removerBasemapsDoProjeto(): Promise<void> {
  await apiRequest('PATCH', '/settings', { basemaps: null });
}

/** Responde os tiles do basemap de teste e devolve quantos foram pedidos até agora. */
export async function servirTilesDeTeste(page: Page): Promise<() => number> {
  let pedidos = 0;
  await page.route(`${HOST_DOS_TILES}/**`, async (rota) => {
    pedidos += 1;
    await rota.fulfill({ body: TILE, contentType: 'image/png' });
  });
  return () => pedidos;
}
