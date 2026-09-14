import { describe, expect, it } from 'vitest';
import { resolveFieldTemplate, serializeItemRow, serializeValue } from './value-formatter.js';

describe('serializeValue — o que a célula da grade mostra', () => {
  it('mostra texto e número como são', () => {
    expect(serializeValue('Brasília')).toBe('Brasília');
    expect(serializeValue(42)).toBe('42');
    expect(serializeValue(0)).toBe('0');
    expect(serializeValue(false)).toBe('false');
  });

  it('mostra célula vazia para ausência de valor, em vez das palavras null e undefined', () => {
    expect(serializeValue(null)).toBe('');
    expect(serializeValue(undefined)).toBe('');
  });

  it('inverte o ponto para "latitude, longitude", que é a ordem que se lê', () => {
    expect(serializeValue({ type: 'Point', coordinates: [-47.9292, -15.7801] })).toBe(
      '-15.7801, -47.9292'
    );
  });

  it('cai no JSON quando o objeto tem coordinates mas não é um ponto de verdade', () => {
    // antes isto era um type predicate que só checava a presença da chave, e
    // lia coordinates[1] de um texto, produzindo "undefined, undefined"
    expect(serializeValue({ coordinates: 'não é um par' })).toBe('{"coordinates":"não é um par"}');
    expect(serializeValue({ coordinates: [1] })).toBe('{"coordinates":[1]}');
  });

  it('junta lista por vírgula, que é como um campo de múltipla escolha aparece', () => {
    expect(serializeValue(['a', 'b', 'c'])).toBe('a, b, c');
    expect(serializeValue([])).toBe('');
  });

  it('cai no JSON para qualquer outro objeto, para a célula não ficar "[object Object]"', () => {
    expect(serializeValue({ nome: 'x' })).toBe('{"nome":"x"}');
  });
});

describe('resolveFieldTemplate — o rótulo do popup do marcador', () => {
  const item = { id: 7, nome: 'Brasília', uf: 'DF', vazio: null };

  it('substitui cada {{campo}} pelo valor do item', () => {
    expect(resolveFieldTemplate(item, '{{nome}}')).toBe('Brasília');
    expect(resolveFieldTemplate(item, '{{nome}} - {{uf}}')).toBe('Brasília - DF');
  });

  it('aceita o nome cru de um campo, porque as opções do layout permitem os dois formatos', () => {
    expect(resolveFieldTemplate(item, 'nome')).toBe('Brasília');
  });

  it('cai no id quando o template está vazio, para o popup nunca abrir em branco', () => {
    expect(resolveFieldTemplate(item, '')).toBe('7');
  });

  it('cai no id quando os campos do template não existem no item', () => {
    expect(resolveFieldTemplate(item, '{{inexistente}}')).toBe('7');
    expect(resolveFieldTemplate(item, '{{vazio}}')).toBe('7');
  });

  it('mantém o texto fixo em volta dos campos', () => {
    expect(resolveFieldTemplate(item, 'Cidade: {{nome}}')).toBe('Cidade: Brasília');
  });

  it('trata um nome cru desconhecido como template sem campo, e cai no id', () => {
    expect(resolveFieldTemplate(item, 'texto solto')).toBe('texto solto');
    expect(resolveFieldTemplate(item, 'inexistente')).toBe('inexistente');
  });
});

describe('serializeItemRow — o valor de um campo numa linha da grade', () => {
  const item = { id: 1, nome: 'Brasília' };

  it('mostra o valor do campo', () => {
    expect(serializeItemRow(item, 'nome')).toBe('Brasília');
  });

  it('mostra célula vazia quando o item ou o campo não existem, sem lançar', () => {
    expect(serializeItemRow(item, 'inexistente')).toBe('');
    expect(serializeItemRow(null, 'nome')).toBe('');
    expect(serializeItemRow(undefined, 'nome')).toBe('');
  });
});
