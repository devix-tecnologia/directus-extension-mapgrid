import { expect, type Page, test } from '@playwright/test';

/**
 * Abre cada story num navegador de verdade e falha se alguma escrever no
 * console.
 *
 * Existe porque nem o `build-storybook` nem os testes unitários enxergam este
 * tipo de problema: os dois já passavam enquanto o console acusava props não
 * declaradas chegando a um componente e a ponte de devtools do vue-i18n
 * quebrando uma vez por story. São defeitos reais — uma prop que o componente
 * ignora em silêncio costuma ser prop que alguém achou que estava passando.
 */

interface ConsoleProblem {
  storyId: string;
  kind: string;
  text: string;
}

/**
 * O Chromium sem GPU emite mensagens do próprio driver de software ao desenhar
 * o mapa. Não vêm do projeto e não há o que corrigir nelas — é a única exceção,
 * e casada por texto exato de driver justamente para não virar um ralo onde
 * avisos de verdade somem.
 */
const isHeadlessGpuNoise = (text: string): boolean =>
  /GL Driver Message|GPU stall due to ReadPixels|Failed to initialize WebGL/i.test(text);

interface StoryIndexEntry {
  id: string;
  /** `story` para uma story; `docs` para a página de autodocs de um componente. */
  type: string;
  name: string;
  title: string;
}

const fetchIndexEntries = async (page: Page, baseURL: string): Promise<StoryIndexEntry[]> => {
  const response = await page.request.get(`${baseURL}/index.json`);
  expect(response.ok(), 'o Storybook precisa servir o índice de stories').toBe(true);

  const index: unknown = await response.json();
  const entries =
    typeof index === 'object' && index !== null && 'entries' in index
      ? (index as { entries: Record<string, StoryIndexEntry> }).entries
      : {};

  /*
   * Stories e páginas de docs. A página de docs monta todas as stories do
   * componente de uma vez, num app diferente do da story isolada — foi
   * justamente ali que a ponte de devtools do vue-i18n apareceu quebrando
   * enquanto este check, que só abria `viewMode=story`, passava.
   */
  return Object.values(entries).filter((entry) => entry.type === 'story' || entry.type === 'docs');
};

const describeProblems = (problems: ConsoleProblem[]): string =>
  problems
    .map((problem) => `  [${problem.kind}] ${problem.storyId}\n      ${problem.text}`)
    .join('\n\n');

test('nenhuma story escreve no console do navegador', async ({ page, baseURL }) => {
  expect(baseURL, 'baseURL do Storybook').toBeTruthy();
  const storybookUrl = baseURL ?? '';

  const entries = await fetchIndexEntries(page, storybookUrl);
  expect(entries.length, 'o índice precisa listar ao menos uma entrada').toBeGreaterThan(0);

  const problems: ConsoleProblem[] = [];
  let currentStoryId = '';

  page.on('console', (message) => {
    if (message.type() !== 'warning' && message.type() !== 'error') return;
    const text = message.text();
    if (isHeadlessGpuNoise(text)) return;
    problems.push({ storyId: currentStoryId, kind: message.type(), text });
  });

  page.on('pageerror', (error) => {
    problems.push({ storyId: currentStoryId, kind: 'pageerror', text: String(error) });
  });

  /*
   * Uma rejeição de promise sem tratamento não vira `pageerror`, e era assim
   * que a ponte de devtools falhava: "Uncaught (in promise)". Sem este ouvinte
   * o check não a enxerga.
   */
  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', (event) => {
      console.error(`[unhandledrejection] ${event.reason}`);
    });
  });

  for (const entry of entries) {
    currentStoryId = entry.id;
    const viewMode = entry.type === 'docs' ? 'docs' : 'story';
    await page.goto(`${storybookUrl}/iframe.html?id=${entry.id}&viewMode=${viewMode}`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(250);
  }

  expect(
    problems,
    `${problems.length} mensagem(ns) de console em ${entries.length} entradas:\n\n${describeProblems(problems)}\n`
  ).toEqual([]);
});
