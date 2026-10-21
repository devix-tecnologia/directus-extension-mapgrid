import { describe, expect, it } from 'vitest';
import { ClaudeToken } from './credential.ts';

const VALID = `sk-ant-oat01-${'a1B2_c3-D4'.repeat(9)}`;

describe('ClaudeToken.normalise', () => {
  const token = new ClaudeToken();

  it('accepts the claude setup-token token', () => {
    expect(token.normalise(VALID)).toBe(VALID);
  });

  it('strips the line break and the spaces a terminal paste puts in the middle', () => {
    expect(token.normalise(`  ${VALID.slice(0, 40)}\n  ${VALID.slice(40)}\n`)).toBe(VALID);
  });

  it.each([
    ['empty', ''],
    ['an API key', `sk-ant-api03-${'x'.repeat(90)}`],
    ['too short', 'sk-ant-oat01-abc'],
    ['with a strange character', `${VALID}!`],
  ])('refuses %s', (_case, raw) => {
    expect(token.normalise(raw)).toBeNull();
  });
});
