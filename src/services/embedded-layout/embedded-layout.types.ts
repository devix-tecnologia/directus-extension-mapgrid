import type { LayoutConfig, LayoutProps } from '@directus/types';
import type { Component } from 'vue';

/**
 * Um layout do Directus rodando dentro do nosso.
 *
 * `state` é o que o `setup()` dele devolveu, mais os props e os
 * `onUpdate:<chave>` — a mesma composição que o `createLayoutWrapper` monta.
 * `component` e `optionsComponent` são o que desenha a área e o painel.
 */
export interface LayoutEmbutido {
  readonly id: string;
  readonly state: Record<string, unknown>;
  readonly component: Component | null;
  readonly optionsComponent: Component | null;
}

/** O que o registro de layouts do app entrega. */
export type RegistroDeLayouts = readonly LayoutConfig[];

/**
 * O estado que os layouts embutidos dividem entre si.
 *
 * `selection` e `layoutQuery` são dois dos três props que sobem como emit no
 * contrato do Directus, e é por eles que mapa e grade se sincronizam: ordenar
 * num refaz a busca do outro, e marcar uma linha acende o marcador.
 * `layoutOptions` é de cada um — o mapa guarda ali o campo de geometria, a
 * grade o espaçamento.
 */
export interface EstadoCompartilhado {
  selection: (string | number)[];
  layoutQuery: Record<string, unknown>;
}

export interface OpcoesDeEmbutir {
  readonly id: string;
  readonly registro: RegistroDeLayouts;
  readonly props: LayoutProps;
  readonly emit: (evento: string, valor: unknown) => void;
}
