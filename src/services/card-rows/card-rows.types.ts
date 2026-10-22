/** One line of the card as the preset keeps it: a display template and, if wanted, its own label. */
export interface CardRowOption {
  /** Directus display template: `{{smartphone.brand}} {{smartphone.model}}`. */
  template: string;
  /** Shown left of the value; the first field's name when empty. */
  label?: string;
}

/** A line ready to draw: the label resolved, and a key that stays put while the line does. */
export interface CardTemplateRow {
  key: string;
  label: string;
  template: string;
}

/**
 * The card's lines. They come from `cardRows`; a preset from before them keeps
 * working, its `cardFields` read as one `{{field}}` line each, and without
 * either the card shows the grid's columns.
 */
export interface ICardRows {
  /** The lines the preset asks for, the older forms read as lines too. */
  optionsFrom(source: {
    cardRows?: readonly CardRowOption[] | null;
    cardFields?: readonly string[] | null;
    gridFields?: readonly string[] | null;
  }): CardRowOption[];
  /** The field paths a template names, in order and once: what to ask Directus for. */
  fieldsOf(templates: readonly string[]): string[];
  /** The lines with their labels: the one given, or the first named field's name. */
  rows(
    options: readonly CardRowOption[],
    nameOf: (path: string) => string | null
  ): CardTemplateRow[];
}
