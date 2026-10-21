/**
 * Moments the way the MapGrid shows them: `27/03/2026 10:30:47` in pt-BR —
 * two-digit day and month, the full year, a 24-hour clock with seconds, and a
 * space between date and time, never a comma.
 *
 * The order of day and month follows the locale; the rest does not.
 */
export interface IInstantFormat {
  /** Date and time, to the second. */
  dateTime(instant: number | Date, locale: string): string;
  /** The date alone, for fields that have no time. */
  date(instant: number | Date, locale: string): string;
}
