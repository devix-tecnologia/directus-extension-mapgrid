import { describe, expect, it } from 'vitest';
import { MESSAGES, type MessageLocale } from './messages';

/**
 * One locale's strings, indexed by loose key. `Object.entries` hands back the
 * key as `string`, and widening here avoids re-asserting it on every read.
 */
const textsOf = (locale: MessageLocale): Record<string, string> => MESSAGES[locale];

describe('MESSAGES — pt-BR has to keep up with en-US', () => {
  const englishKeys = Object.keys(textsOf('en-US')).sort();
  const portugueseKeys = Object.keys(textsOf('pt-BR')).sort();

  it('translates exactly the same keys, so no string falls back to the wrong language', () => {
    expect(portugueseKeys).toEqual(englishKeys);
  });

  it('leaves no blank string, which would show as a missing label in the interface', () => {
    for (const locale of ['en-US', 'pt-BR'] as const) {
      for (const [key, value] of Object.entries(textsOf(locale))) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });

  it('keeps the same parameters in both languages, or interpolation vanishes in translation', () => {
    const paramsOf = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();

    for (const [key, english] of Object.entries(textsOf('en-US'))) {
      const portuguese = textsOf('pt-BR')[key];
      expect(portuguese, key).toBeDefined();
      expect(paramsOf(portuguese ?? ''), key).toEqual(paramsOf(english));
    }
  });
});
