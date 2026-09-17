/**
 * A ordenação, nos dois formatos em que ela existe.
 *
 * O preset guarda o formato do Directus para consultas: uma lista de campos em
 * que o prefixo `-` significa descendente. O `v-table`, por outro lado, fala
 * `{ by, desc }`. São a mesma informação em duas gramáticas, e traduzir entre
 * elas é lógica pura — fica aqui, e não no componente, para ser exercitada sem
 * montar nada.
 */

/** Como o `v-table` do Directus descreve a ordenação. */
export interface TableSort {
  by: string | null;
  desc: boolean;
}

/** Lê a ordenação da consulta. Só o primeiro campo: a tabela ordena por um. */
export const toTableSort = (sort: string[] | undefined | null): TableSort => {
  const [first] = sort ?? [];
  if (!first) return { by: null, desc: false };

  return first.startsWith('-') ? { by: first.slice(1), desc: true } : { by: first, desc: false };
};

/** Escreve a ordenação da tabela de volta no formato da consulta. */
export const fromTableSort = ({ by, desc }: TableSort): string[] =>
  by === null || by === '' ? [] : [desc ? `-${by}` : by];
