import type { IRowHighlighter } from './row-highlighter.types';

/** The class the composition's stylesheet paints. */
export const CURRENT_ROW_CLASS = 'mapgrid-current-row';

/**
 * The `v-table` has no notion of a current row, so the mark is a class put on
 * the row element. It depends on the Directus table rendering its rows as
 * `tbody tr` — the one assumption, and the cheapest of the candidates: it
 * touches no state of theirs, so nothing else in the layout reacts to it.
 */
export class TableRowHighlighter implements IRowHighlighter {
  constructor(private readonly root: () => HTMLElement | null) {}

  highlight(index: number): void {
    const rows = this.root()?.querySelectorAll<HTMLElement>('tbody tr');
    if (!rows) return;

    for (const row of rows) row.classList.remove(CURRENT_ROW_CLASS);

    const current = index < 0 ? undefined : rows[index];
    if (!current) return;

    current.classList.add(CURRENT_ROW_CLASS);
    current.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
}
