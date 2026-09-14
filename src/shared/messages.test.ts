import { describe, expect, it } from 'vitest';
import { MESSAGES, type MessageLocale } from './messages';

/**
 * Os textos de um idioma indexados por chave solta. `Object.entries` devolve a
 * chave como `string`, e alargar aqui evita reasseverá-la a cada leitura.
 */
const textsOf = (locale: MessageLocale): Record<string, string> => MESSAGES[locale];

describe('MESSAGES — o pt-BR precisa acompanhar o en-US', () => {
  const englishKeys = Object.keys(textsOf('en-US')).sort();
  const portugueseKeys = Object.keys(textsOf('pt-BR')).sort();

  it('traduz exatamente as mesmas chaves, para nenhum texto cair no idioma errado', () => {
    expect(portugueseKeys).toEqual(englishKeys);
  });

  it('não deixa texto em branco, que apareceria como um rótulo sumido na interface', () => {
    for (const locale of ['en-US', 'pt-BR'] as const) {
      for (const [key, value] of Object.entries(textsOf(locale))) {
        expect(value.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });

  it('mantém os mesmos parâmetros nos dois idiomas, senão a interpolação some na tradução', () => {
    const paramsOf = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort();

    for (const [key, english] of Object.entries(textsOf('en-US'))) {
      const portuguese = textsOf('pt-BR')[key];
      expect(portuguese, key).toBeDefined();
      expect(paramsOf(portuguese ?? ''), key).toEqual(paramsOf(english));
    }
  });
});
