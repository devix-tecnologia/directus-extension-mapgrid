import type { NomeDeEvidencia } from './nome-de-evidencia.types';

/** Onde as evidências moram, relativo à raiz do repositório. */
export const DIRETORIO_DE_EVIDENCIAS = 'TASKS/assets';

/**
 * Nome do arquivo de evidência.
 *
 * Começa pelo número da task porque é assim que `TASKS/assets/` é lido: quem
 * abre a pasta procura pela task, não pelo assunto. O momento (`antes`/`depois`)
 * entra no NOME, e não em subdiretórios, para o par aparecer lado a lado.
 */
export function nomeDeEvidencia({ task, rotulo, momento }: NomeDeEvidencia): string {
  if (!/^[a-z0-9-]+$/i.test(rotulo)) {
    throw new Error(
      `rótulo inválido: ${JSON.stringify(rotulo)} — use apenas letras, números e hífen. ` +
        `Um rótulo com barra ou ".." escreveria o PNG fora de ${DIRETORIO_DE_EVIDENCIAS}.`
    );
  }

  const numero = String(task)
    .replace(/^task-/i, '')
    .padStart(3, '0');

  return `task-${numero}-${rotulo}${momento ? `-${momento}` : ''}.png`;
}
