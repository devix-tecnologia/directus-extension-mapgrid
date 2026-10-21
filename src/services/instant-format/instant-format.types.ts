/**
 * Moments the way the MapGrid shows them: `27/03/2026 10:30:47` in pt-BR —
 * two-digit day and month, the full year, a 24-hour clock with seconds, and a
 * space between date and time, never a comma.
 *
 * The same pattern in every language — the one the grid's date column is set
 * to — so the card, the timeline and the grid never disagree on the order.
 */
export interface IInstantFormat {
  /** Date and time, to the second. */
  dateTime(instant: number | Date, locale: string): string;
  /** The date alone, for fields that have no time. */
  date(instant: number | Date, locale: string): string;
}
