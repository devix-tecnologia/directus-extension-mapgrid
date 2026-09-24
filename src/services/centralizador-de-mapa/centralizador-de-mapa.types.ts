/** `[oeste, sul, leste, norte]`, em graus — a forma do `bbox` do GeoJSON. */
export type Retangulo = [number, number, number, number];

/** O tamanho, em pixels, da área em que o mapa é desenhado. */
export interface TamanhoDaTela {
  largura: number;
  altura: number;
}

export interface OpcoesDeCentralizacao {
  /**
   * Só move quando o alvo está fora da área visível. É o que a navegação entre
   * registros quer: andar de um ponto a outro que já está na tela não pode fazer
   * o mapa tremer. Padrão: `true`.
   */
  somenteSeFora?: boolean;
}

/**
 * Leva o mapa até uma geometria.
 *
 * Um ponto é centralizado mantendo o zoom de agora; uma linha ou um polígono é
 * enquadrado inteiro. Geometria que não se lê não mexe na câmera.
 */
export interface ICentralizadorDeMapa {
  /** Devolve se pediu movimento ao mapa. */
  centralizar(geometria: unknown, opcoes?: OpcoesDeCentralizacao): boolean;
}
