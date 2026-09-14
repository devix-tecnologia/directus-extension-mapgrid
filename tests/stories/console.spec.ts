import { expect, type Page, test } from '@playwright/test';

/**
 * Opens every story in a real browser and fails if any of them writes to the
 * console.
 *
 * It exists because neither `build-storybook` nor the unit tests can see this
 * kind of problem: both were passing while the console reported undeclared
 * props reaching a component and vue-i18n's devtools bridge breaking once per
 * story. These are real defects — a prop the component silently ignores is
 * usually a prop somebody believed they were passing.
 */

interface ConsoleProblem {
  storyId: string;
  kind: string;
  text: string;
}

/**
 * Chromium with no GPU emits messages from its own software driver while
 * drawing the map. They do not come from this project and there is nothing to
 * fix in them — this is the only exception, and it matches exact driver text
 * precisely so it does not become a drain where real warnings disappear.
 */
const isHeadlessGpuNoise = (text: string): boolean =>
  /GL Driver Message|GPU stall due to ReadPixels|Failed to initialize WebGL/i.test(text);

interface StoryIndexEntry {
  id: string;
  /** `story` for a story; `docs` for a component's autodocs page. */
  type: string;
  name: string;
  title: string;
}

const fetchIndexEntries = async (page: Page, baseURL: string): Promise<StoryIndexEntry[]> => {
  const response = await page.request.get(`${baseURL}/index.json`);
  expect(response.ok(), 'Storybook must serve the story index').toBe(true);

  const index: unknown = await response.json();
  const entries =
    typeof index === 'object' && index !== null && 'entries' in index
      ? (index as { entries: Record<string, StoryIndexEntry> }).entries
      : {};

  /*
   * Stories and docs pages. A docs page mounts all of a component's stories at
   * once, in a different app from the isolated story — and that is exactly
   * where vue-i18n's devtools bridge showed up breaking while this check,
   * which only opened `viewMode=story`, was passing.
   */
  return Object.values(entries).filter((entry) => entry.type === 'story' || entry.type === 'docs');
};

const describeProblems = (problems: ConsoleProblem[]): string =>
  problems
    .map((problem) => `  [${problem.kind}] ${problem.storyId}\n      ${problem.text}`)
    .join('\n\n');

test('no story writes to the browser console', async ({ page, baseURL }) => {
  expect(baseURL, 'Storybook baseURL').toBeTruthy();
  const storybookUrl = baseURL ?? '';

  const entries = await fetchIndexEntries(page, storybookUrl);
  expect(entries.length, 'the index must list at least one entry').toBeGreaterThan(0);

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
   * An unhandled promise rejection does not become a `pageerror`, and that is
   * how the devtools bridge failed: "Uncaught (in promise)". Without this
   * listener the check cannot see it.
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
    `${problems.length} console message(s) across ${entries.length} entries:\n\n${describeProblems(problems)}\n`
  ).toEqual([]);
});
