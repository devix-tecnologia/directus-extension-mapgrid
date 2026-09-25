/**
 * O contrato com os layouts do Directus, medido contra o Directus de verdade.
 *
 * A composição lê chaves do `setup()` dos layouts `tabular` e `map` — `items`,
 * `tableHeaders`, `onSortChange`, `geometryField`, `slots.options` e as outras
 * que `EMBEDDED_CONTRACT` lista. Nenhuma é API pública, e renomear
 * qualquer uma **não levanta exceção**: a grade fica vazia, o clique na linha
 * volta a navegar para fora, o mapa não acha a geometria. Os unitários fixam a
 * regra com layouts de mentira; só aqui o Directus real responde.
 *
 * É por isso que este spec não pode ser um teste de DOM: ele observa o console
 * do navegador, onde `embedLayout` grita o que faltou. Falha alta, com o nome
 * da chave que sumiu, em vez de um spec de tela que reprova três telas depois.
 */
import { expect, test } from '@playwright/test';
import { CONTRACT_MARKER, EMBEDDED_CONTRACT } from '../../src/services/embedded-layout/index';
import { ensureMapGridPreset } from '../helpers/mapgrid-preset';
import { setupTestEnvironment } from '../setup';
import { GRADE, login, MAPA, openCollection, TABELA } from './helpers/mapgrid-page';

test.beforeAll(async () => {
  await setupTestEnvironment();
});

test.describe('MapGrid — o contrato com os layouts embutidos', () => {
  test('os layouts do Directus devolvem tudo que a composição lê', async ({ page }) => {
    const reclamacoes: string[] = [];
    page.on('console', (mensagem) => {
      const texto = mensagem.text();
      if (texto.includes(CONTRACT_MARKER)) reclamacoes.push(texto);
    });

    await ensureMapGridPreset();
    await login(page);
    await openCollection(page);

    /*
     * A composição na tela é o que prova que `embedLayout` chegou a rodar
     * para os dois ids. Sem esta parte, "nenhuma reclamação no console" também
     * seria verdade numa tela onde nada montou.
     */
    await expect(page.locator(MAPA)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(GRADE)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TABELA)).toBeVisible({ timeout: 60_000 });

    for (const reclamacao of reclamacoes) console.log(`\n[contrato] ${reclamacao}`);
    console.log(
      `\n[contrato] conferidas ${EMBEDDED_CONTRACT.tabular.length} chaves da grade e ` +
        `${EMBEDDED_CONTRACT.map.length} do mapa, mais o painel de opções de cada um`
    );

    expect(reclamacoes).toEqual([]);
  });

  /*
   * Controle negativo do teste acima, e ele existe por um motivo estreito: a
   * asserção de lá é a AUSÊNCIA de uma mensagem, e uma escuta de console que
   * parasse de funcionar daria o mesmo resultado que um contrato intacto. Aqui
   * a mensagem é forjada na página, e o coletor tem de vê-la.
   */
  test('a escuta do console enxerga a marca, senão o teste acima não vale nada', async ({
    page,
  }) => {
    const reclamacoes: string[] = [];
    page.on('console', (mensagem) => {
      const texto = mensagem.text();
      if (texto.includes(CONTRACT_MARKER)) reclamacoes.push(texto);
    });

    await login(page);
    await page.evaluate(
      (marca) => console.error(`${marca}: forjado pelo controle negativo`),
      CONTRACT_MARKER
    );

    await expect.poll(() => reclamacoes.length, { timeout: 10_000 }).toBe(1);
  });
});
