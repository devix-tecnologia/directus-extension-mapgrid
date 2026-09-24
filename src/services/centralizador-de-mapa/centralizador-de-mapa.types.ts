/** `[oeste, sul, leste, norte]`, em graus — a forma do `bbox` do GeoJSON. */
export type Retangulo = [number, number, number, number];

/** O tamanho, em pixels, da área em que o mapa é desenhado. */
export interface TamanhoDaTela {
  largura: number;
  altura: number;
}

/** O relógio do centralizador — `nextTick` e `setInterval` em produção. */
export interface AgendaDoCentralizador {
  /** Roda depois de o Vue propagar as props — em produção, o `nextTick`. */
  depoisDaAtualizacao(tarefa: () => void): void;
  /** Roda a cada `intervaloMs` até a função devolvida ser chamada. */
  repetir(tarefa: () => void, intervaloMs: number): () => void;
}

export interface OpcoesDeCentralizacao {
  /** Enquadra o ponto por si mesmo, até o `maxZoom` do Directus, em vez de manter o zoom. Padrão: `false`. */
  aproximar?: boolean;
  /** Não move quando o alvo já está na área visível. Padrão: `true`. */
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
  /** Centraliza um item da coleção pela geometria que o mapa montou para ele. */
  centralizarItem(item: Record<string, unknown>, opcoes?: OpcoesDeCentralizacao): boolean;
  /** Enquadra a coleção inteira. */
  enquadrarTudo(): void;
}
