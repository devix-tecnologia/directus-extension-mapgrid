import { describe, expect, it } from 'vitest';
import { TokenDoClaude } from './credencial.ts';

const VALIDO = `sk-ant-oat01-${'a1B2_c3-D4'.repeat(9)}`;

describe('TokenDoClaude.normalizar', () => {
  const token = new TokenDoClaude();

  it('aceita o token do claude setup-token', () => {
    expect(token.normalizar(VALIDO)).toBe(VALIDO);
  });

  it('tira a quebra de linha e os espaços que a cópia do terminal põe no meio', () => {
    expect(token.normalizar(`  ${VALIDO.slice(0, 40)}\n  ${VALIDO.slice(40)}\n`)).toBe(VALIDO);
  });

  it.each([
    ['vazio', ''],
    ['chave de API', `sk-ant-api03-${'x'.repeat(90)}`],
    ['curto demais', 'sk-ant-oat01-abc'],
    ['com caractere estranho', `${VALIDO}!`],
  ])('recusa %s', (_caso, bruto) => {
    expect(token.normalizar(bruto)).toBeNull();
  });
});
