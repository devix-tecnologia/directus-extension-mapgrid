/** `[oeste, sul, leste, norte]`, em graus — a forma do `bbox` do GeoJSON. */
export type Retangulo = [number, number, number, number];

/** O tamanho, em pixels, da área em que o mapa é desenhado. */
export interface TamanhoDaTela {
  largura: number;
  altura: number;
}

/**
 * O tempo, visto pelo centralizador. Injetado para o teste controlar o relógio.
 */
export interface AgendaDoCentralizador {
  /** Roda depois de o Vue propagar as props — em produção, o `nextTick`. */
  depoisDaAtualizacao(tarefa: () => void): void;
  /** Roda a cada `intervaloMs` até a função devolvida ser chamada. */
  repetir(tarefa: () => void, intervaloMs: number): () => void;
}

export interface OpcoesDeCentralizacao {
  /**
   * Aproxima em vez de manter o zoom: o ponto é enquadrado por si mesmo, e o
   * mapa chega ao zoom máximo do enquadramento (o `maxZoom` 14 do Directus). É o
   * "zoom ao clicar na linha". Não muda nada para linha e polígono, que já são
   * enquadrados inteiros. Padrão: `false`.
   */
  aproximar?: boolean;
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
