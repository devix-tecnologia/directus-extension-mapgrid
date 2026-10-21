import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ArquivoDeEvidencia,
  IEvidenciasDoRepositorio,
  IVerificadorDeTamanhoDeEvidencia,
} from './tamanho-de-evidencia.types';

export const TETO_DE_EVIDENCIA_EM_BYTES = 300 * 1024;

const DIRETORIO_DE_EVIDENCIAS = 'TASKS/assets';

const emKb = (bytes: number): string => `${Math.round(bytes / 1024)} KB`;

export class VerificadorDeTamanhoDeEvidencia implements IVerificadorDeTamanhoDeEvidencia {
  acimaDoTeto(arquivos: readonly ArquivoDeEvidencia[]): ArquivoDeEvidencia[] {
    return arquivos.filter((arquivo) => arquivo.bytes > TETO_DE_EVIDENCIA_EM_BYTES);
  }

  relatar(acima: readonly ArquivoDeEvidencia[]): string {
    if (acima.length === 0) return '';
    const linhas = acima.map((arquivo) => `  ${arquivo.caminho}: ${emKb(arquivo.bytes)}`);
    return [
      `Evidência acima do teto de ${emKb(TETO_DE_EVIDENCIA_EM_BYTES)} por arquivo:`,
      ...linhas,
      'Recorte a área que importa e comprima; movimento vai como tira de quadros parados.',
    ].join('\n');
  }
}

export class EvidenciasDoRepositorio implements IEvidenciasDoRepositorio {
  private readonly raiz: string;

  constructor(raiz: string = process.cwd()) {
    this.raiz = raiz;
  }

  listar(): ArquivoDeEvidencia[] {
    const saida = execFileSync(
      'git',
      [
        'ls-files',
        '--cached',
        '--others',
        '--exclude-standard',
        '-z',
        '--',
        DIRETORIO_DE_EVIDENCIAS,
      ],
      { cwd: this.raiz, encoding: 'utf8' }
    );
    return saida
      .split('\0')
      .filter((caminho) => caminho.length > 0)
      .flatMap((caminho) => {
        try {
          return [{ bytes: statSync(join(this.raiz, caminho)).size, caminho }];
        } catch {
          return [];
        }
      });
  }
}
