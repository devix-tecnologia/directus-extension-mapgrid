import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ArquivoDeEvidencia,
  IEvidenciasDoRepositorio,
  IVerificadorDeTamanhoDeEvidencia,
} from './tamanho-de-evidencia.types';

/**
 * O teto de cada arquivo em `TASKS/assets` (Sidarta, 2026-09-23).
 *
 * A primeira evidência em vídeo da task-010 — quatro `.webm` e quatro GIFs —
 * somou 16 MB, oito vezes o pack inteiro do repositório; e o git guarda para
 * sempre o que entra no histórico. Evidência de movimento vai como tira de
 * quadros parados, que fica na casa das dezenas de KB; o vídeo se regera pela
 * spec de evidência quando alguém precisar dele.
 */
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

/**
 * Os arquivos de `TASKS/assets` que o git versiona **ou versionaria**: os
 * rastreados mais os não rastreados que o `.gitignore` não exclui. Olhar só os
 * rastreados deixaria o arquivo pesado passar até depois do commit — tarde,
 * porque aí ele já está no histórico.
 */
export class EvidenciasDoRepositorio implements IEvidenciasDoRepositorio {
  private readonly raiz: string;

  constructor(raiz: string = process.cwd()) {
    this.raiz = raiz;
  }

  listar(): ArquivoDeEvidencia[] {
    const saida = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', DIRETORIO_DE_EVIDENCIAS],
      { cwd: this.raiz, encoding: 'utf8' }
    );
    return saida
      .split('\0')
      .filter((caminho) => caminho.length > 0)
      .flatMap((caminho) => {
        try {
          return [{ bytes: statSync(join(this.raiz, caminho)).size, caminho }];
        } catch {
          // rastreado mas apagado do disco: não pesa no próximo commit
          return [];
        }
      });
  }
}
