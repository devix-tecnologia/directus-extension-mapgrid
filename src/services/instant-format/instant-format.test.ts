import { describe, expect, it } from 'vitest';
import { InstantFormat } from './instant-format';

const format = new InstantFormat();
/** Built from local parts, so the test does not depend on the machine's time zone. */
const MOMENT = new Date(2026, 2, 27, 10, 30, 47);

describe('InstantFormat', () => {
  it('writes date and time to the second, with a space and no comma', () => {
    expect(format.dateTime(MOMENT, 'pt-BR')).toBe('27/03/2026 10:30:47');
  });

  it('pads day, month, hour, minute and second to two digits', () => {
    expect(format.dateTime(new Date(2026, 0, 5, 7, 4, 9), 'pt-BR')).toBe('05/01/2026 07:04:09');
  });

  it('keeps a 24-hour clock in a locale that would say PM', () => {
    expect(format.dateTime(new Date(2026, 2, 27, 22, 0, 0), 'en-US')).toBe('03/27/2026 22:00:00');
  });

  it('writes the date alone', () => {
    expect(format.date(MOMENT, 'pt-BR')).toBe('27/03/2026');
  });
});
