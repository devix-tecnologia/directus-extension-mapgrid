import type { IInstantFormat } from './instant-format.types';

/** The pattern, in date-fns tokens, for the Directus displays that take one. */
export const DATE_TIME_PATTERN = 'dd/MM/yyyy HH:mm:ss';

export class InstantFormat implements IInstantFormat {
  dateTime(instant: number | Date, locale: string): string {
    return `${this.date(instant, locale)} ${this.time(instant, locale)}`;
  }

  date(instant: number | Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(instant);
  }

  private time(instant: number | Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(instant);
  }
}
