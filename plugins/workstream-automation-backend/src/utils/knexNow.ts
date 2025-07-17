import { DateTime } from 'luxon';

export function knexNow(): string {
  return DateTime.now().toUTC().toISO();
}
