/** Um arquivo de evidência, pelo caminho relativo à raiz do repositório. */
export interface ArquivoDeEvidencia {
  readonly caminho: string;
  readonly bytes: number;
}

/** Quem diz quais arquivos de evidência passam do teto. */
export interface IVerificadorDeTamanhoDeEvidencia {
  acimaDoTeto(arquivos: readonly ArquivoDeEvidencia[]): ArquivoDeEvidencia[];
  relatar(acima: readonly ArquivoDeEvidencia[]): string;
}

/** Quem lista os arquivos de evidência do repositório. */
export interface IEvidenciasDoRepositorio {
  listar(): ArquivoDeEvidencia[];
}
