export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface WaitOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

export async function waitForCondition<Truthiness>(
  probe: () => Promise<Truthiness>,
  { intervalMs = 500, timeoutMs = 15_000 }: WaitOptions = {}
): Promise<NonNullable<Truthiness>> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await probe();
    if (result) return result as NonNullable<Truthiness>;
    await sleep(intervalMs);
  }

  throw new Error(`Timed out after ${timeoutMs}ms while waiting for a condition`);
}
