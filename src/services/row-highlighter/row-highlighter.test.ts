// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_ROW_CLASS, TableRowHighlighter } from './row-highlighter';

let pane: HTMLElement;

const rows = (): HTMLElement[] => [...pane.querySelectorAll('tbody tr')] as HTMLElement[];

const highlighted = (): number[] =>
  rows().flatMap((row, index) => (row.classList.contains(CURRENT_ROW_CLASS) ? [index] : []));

beforeEach(() => {
  pane = document.createElement('div');
  pane.innerHTML = `
    <table>
      <thead><tr><th>Name</th></tr></thead>
      <tbody><tr><td>a</td></tr><tr><td>b</td></tr><tr><td>c</td></tr></tbody>
    </table>`;
  document.body.replaceChildren(pane);
});

const highlighter = (root: () => HTMLElement | null = () => pane) => new TableRowHighlighter(root);

describe('TableRowHighlighter', () => {
  it('marks the row of the current record', () => {
    highlighter().highlight(1);

    expect(highlighted()).toEqual([1]);
  });

  it('moves the mark instead of accumulating it', () => {
    const highlight = highlighter();

    highlight.highlight(1);
    highlight.highlight(2);

    expect(highlighted()).toEqual([2]);
  });

  it('clears the mark when there is no current record', () => {
    const highlight = highlighter();

    highlight.highlight(1);
    highlight.highlight(-1);

    expect(highlighted()).toEqual([]);
  });

  it('leaves the header alone, which is a row too', () => {
    highlighter().highlight(0);

    const header = pane.querySelector('thead tr') as HTMLElement;
    expect(header.classList.contains(CURRENT_ROW_CLASS)).toBe(false);
  });

  it('scrolls the row into view without dragging the page along', () => {
    const scrollIntoView = vi.fn();
    for (const row of rows()) {
      row.scrollIntoView = scrollIntoView;
    }

    highlighter().highlight(2);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });

  it('does not scroll when the mark only got cleared', () => {
    const scrollIntoView = vi.fn();
    for (const row of rows()) {
      row.scrollIntoView = scrollIntoView;
    }

    highlighter().highlight(-1);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('ignores a row that is past the end of the page', () => {
    expect(() => highlighter().highlight(9)).not.toThrow();
    expect(highlighted()).toEqual([]);
  });

  it('ignores a pane that is not on screen yet', () => {
    expect(() => highlighter(() => null).highlight(1)).not.toThrow();
  });
});
