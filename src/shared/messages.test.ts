import { describe, expect, it } from 'vitest';
import { MESSAGES } from './messages.js';

describe('MESSAGES — o pt-BR precisa acompanhar o en-US', () => {
  const englishKeys = Object.keys(MESSAGES['en-US']).sort();
  const portugueseKeys = Object.keys(MESSAGES['pt-BR']).sort();

  it('traduz exatamente as mesmas chaves, para nenhum texto cair no idioma errado', () => {
    expect(portugueseKeys).toEqual(englishKeys);
  });

  it('não deixa texto em branco, que apareceria como um rótulo sumido na interface', () => {
    for (const locale of ['en-US', 'pt-BR'] as const) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });

  it('mantém os mesmos parâmetros nos dois idiomas, senão a interpolação some na tradução', () => {
    const paramsOf = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();

    for (const key of englishKeys as MessageKeys[]) {
      expect(paramsOf(MESSAGES['pt-BR'][key]), key).toEqual(paramsOf(MESSAGES['en-US'][key]));
    }
  });
});

type MessageKeys = keyof (typeof MESSAGES)['en-US'];
