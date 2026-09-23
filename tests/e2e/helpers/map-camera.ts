import { expect, type Page } from '@playwright/test';
import type { CameraState } from './map-projection';

const CAMERA_SETTLE_TIMEOUT_MS = 30_000;

/**
 * A camera do mapa, lida da propria tela.
 *
 * O `MapComponent` publica centro e zoom em `data-center` e `data-zoom` a cada
 * `moveend`, que e o unico ponto em que o estado do MapLibre fica observavel de
 * fora sem alcancar a instancia por dentro.
 */
export async function readCamera(page: Page): Promise<CameraState> {
  const container = page.locator('.map-container');
  await expect(container).toHaveAttribute('data-zoom', /-?\d/, { timeout: 30_000 });
  await expect(container).toHaveAttribute('data-center', /-?\d/, { timeout: 30_000 });

  const rawCenter = (await container.getAttribute('data-center')) ?? '';
  const zoom = Number(await container.getAttribute('data-zoom'));
  const center = rawCenter.split(',').map(Number) as [number, number];
  return { center, zoom };
}

/**
 * Espera o enquadramento inicial terminar de animar.
 *
 * O `fitBounds` entra com `duration`, e uma camera parada nao prova nada: ela
 * tambem fica parada antes de o voo comecar, enquanto a lista ainda nao chegou.
 * Comparar duas leituras seguidas confundia os dois casos — o teste de
 * ordenacao pegava o zoom inicial do Directus como "antes". O `MapComponent`
 * publica `data-initial-fit="done"` no `moveend` que encerra o enquadramento, e
 * e so a partir dali que a camera lida e a do enquadramento.
 */
export async function waitForCameraToSettle(page: Page): Promise<CameraState> {
  await expect(page.locator('.map-container')).toHaveAttribute('data-initial-fit', 'done', {
    timeout: CAMERA_SETTLE_TIMEOUT_MS,
  });
  return readCamera(page);
}
