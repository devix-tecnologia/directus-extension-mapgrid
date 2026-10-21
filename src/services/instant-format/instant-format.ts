import type { IInstantFormat } from './instant-format.types';

/** The pattern, in date-fns tokens, for the Directus displays that take one. */
export const DATE_TIME_PATTERN = 'dd/MM/yyyy HH:mm:ss';

const twoDigits = (value: number): string => String(value).padStart(2, '0');

export class InstantFormat implements IInstantFormat {
  dateTime(instant: number | Date, locale: string): string {
    const moment = new Date(instant);
    return `${this.date(moment, locale)} ${twoDigits(moment.getHours())}:${twoDigits(moment.getMinutes())}:${twoDigits(moment.getSeconds())}`;
  }

  date(instant: number | Date, _locale: string): string {
    const moment = new Date(instant);
    return `${twoDigits(moment.getDate())}/${twoDigits(moment.getMonth() + 1)}/${moment.getFullYear()}`;
  }
}
