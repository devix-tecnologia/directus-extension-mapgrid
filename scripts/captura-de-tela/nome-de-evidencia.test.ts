import { describe, expect, it } from 'vitest';
import { nomeDeEvidencia } from './nome-de-evidencia';

describe('nomeDeEvidencia', () => {
  it('começa pelo número da task, que é como TASKS/assets é indexado', () => {
    expect(nomeDeEvidencia({ task: '008', rotulo: 'grade' })).toBe('task-008-grade.png');
  });

  it('marca antes e depois no nome, não em diretórios separados', () => {
    // Diretórios separados obrigariam quem lê a task a navegar; o par fica
    // óbvio quando os dois nomes aparecem lado a lado na mesma pasta.
    expect(nomeDeEvidencia({ task: '008', rotulo: 'grade', momento: 'antes' })).toBe(
      'task-008-grade-antes.png'
    );
    expect(nomeDeEvidencia({ task: '008', rotulo: 'grade', momento: 'depois' })).toBe(
      'task-008-grade-depois.png'
    );
  });

  it('normaliza o número para três dígitos, como os arquivos de task', () => {
    expect(nomeDeEvidencia({ task: '8', rotulo: 'x' })).toBe('task-008-x.png');
    expect(nomeDeEvidencia({ task: 'task-8', rotulo: 'x' })).toBe('task-008-x.png');
  });

  it('recusa rótulo que geraria nome fora de TASKS/assets', () => {
    // `..` num rótulo escreveria o PNG em outro lugar do repositório.
    expect(() => nomeDeEvidencia({ task: '008', rotulo: '../fora' })).toThrow(/rótulo/i);
  });
});
