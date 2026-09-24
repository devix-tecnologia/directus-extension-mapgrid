import { describe, expect, it } from 'vitest';
import {
  EvidenciasDoRepositorio,
  TETO_DE_EVIDENCIA_EM_BYTES,
  VerificadorDeTamanhoDeEvidencia,
} from './index';

/*
 * O teto de 300 KB por arquivo em `TASKS/assets` (Sidarta, 2026-09-23): a
 * primeira evidência em vídeo da task-010 somou 16 MB, oito vezes o pack
 * inteiro do repositório, e o git guarda para sempre o que entra no histórico.
 */
const KB = 1024;

describe('o verificador acusa o que passa do teto', () => {
  const verificador = new VerificadorDeTamanhoDeEvidencia();

  it('o teto é 300 KB', () => {
    expect(TETO_DE_EVIDENCIA_EM_BYTES).toBe(300 * KB);
  });

  it('acusa o arquivo acima do teto, e só ele', () => {
    const acima = verificador.acimaDoTeto([
      { bytes: 90 * KB, caminho: 'TASKS/assets/tira.jpg' },
      { bytes: 3_500 * KB, caminho: 'TASKS/assets/voo.gif' },
    ]);
    expect(acima.map((arquivo) => arquivo.caminho)).toEqual(['TASKS/assets/voo.gif']);
  });

  it('exatamente no teto passa; um byte acima, não', () => {
    expect(
      verificador.acimaDoTeto([{ bytes: TETO_DE_EVIDENCIA_EM_BYTES, caminho: 'a.png' }])
    ).toEqual([]);
    expect(
      verificador.acimaDoTeto([{ bytes: TETO_DE_EVIDENCIA_EM_BYTES + 1, caminho: 'a.png' }])
    ).toHaveLength(1);
  });

  it('a mensagem diz o arquivo, o tamanho e o teto', () => {
    const mensagem = verificador.relatar([{ bytes: 3_500 * KB, caminho: 'TASKS/assets/voo.gif' }]);
    expect(mensagem).toContain('TASKS/assets/voo.gif');
    expect(mensagem).toContain('3500 KB');
    expect(mensagem).toContain('300 KB');
  });
});

describe('o repositório', () => {
  it('nenhum arquivo em TASKS/assets passa de 300 KB — versionado ou prestes a ser', () => {
    // inclui o que não está versionado mas não é ignorado: barra antes do commit
    const verificador = new VerificadorDeTamanhoDeEvidencia();
    const acima = verificador.acimaDoTeto(new EvidenciasDoRepositorio().listar());
    expect(acima, verificador.relatar(acima)).toEqual([]);
  });

  it('a listagem do repositório enxerga os arquivos de TASKS/assets', () => {
    // sem isto, uma listagem vazia faria o teste acima passar vacuamente
    expect(new EvidenciasDoRepositorio().listar().length).toBeGreaterThan(0);
  });
});
