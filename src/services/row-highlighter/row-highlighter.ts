import type { IRowHighlighter } from './row-highlighter.types';

/** The class the composition's stylesheet paints. */
export const CURRENT_ROW_CLASS = 'mapgrid-current-row';

/** Assumes the Directus table renders its rows as `tbody tr`. */
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
