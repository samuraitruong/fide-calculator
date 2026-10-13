import type { MonthlyData, RatingType, Result } from './types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function isValidRatingMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value.length === 7;
}

/** Accept legacy assignments only at the migration boundary. */
export function normalizeRatingMonth(value?: string): string | undefined {
  if (isValidRatingMonth(value as unknown)) return value;
  if (typeof value !== 'string' || !/^\d{4}-[A-Za-z]{3}$/.test(value)) return undefined;
  const index = MONTHS.findIndex(month => month.slice(0, 3) === value.slice(5));
  return index < 0 ? undefined : `${value.slice(0, 4)}-${String(index + 1).padStart(2, '0')}`;
}

/** String dates retain their written calendar month; Date objects use local calendar time. */
export function getRatingMonthFromDate(date: string | Date): string {
  if (typeof date === 'string') {
    const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/.exec(date);
    const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date);
    const year = Number(iso?.[1] ?? slash?.[3]);
    const month = Number(iso?.[2] ?? slash?.[1]);
    const day = Number(iso?.[3] ?? slash?.[2]);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (daysInMonth && day >= 1 && day <= daysInMonth) {
      // Parse ISO timestamps for validity without allowing timezone conversion to change the month.
      if (iso && !Number.isNaN(new Date(date).getTime())) return `${iso[1]}-${iso[2]}`;
      if (slash && slash[0].length === date.length) return `${slash[3]}-${String(month).padStart(2, '0')}`;
    }
    throw new Error('Invalid game date');
  }
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error('Invalid game date');
  const month = `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (!isValidRatingMonth(month)) throw new Error('Invalid game date');
  return month;
}

export function getResultRatingMonth(result: Pick<Result, 'date' | 'monthKey' | 'ratingMonth'>): string {
  if (result.ratingMonth !== undefined) {
    if (!isValidRatingMonth(result.ratingMonth)) throw new Error('Rating month must use YYYY-MM with a valid month');
    return result.ratingMonth;
  }
  return normalizeRatingMonth(result.monthKey) ?? getRatingMonthFromDate(result.date);
}

export function migrateResultRatingMonth(result: Result): Result {
  const ratingMonth = getResultRatingMonth(result);
  return { ...result, ratingMonth, monthKey: ratingMonth };
}

export function getRatingMonthDisplayName(month: string): string {
  const normalized = normalizeRatingMonth(month);
  if (!normalized) throw new Error('Invalid rating month');
  return `${MONTHS[Number(normalized.slice(5)) - 1]} ${normalized.slice(0, 4)}`;
}

export function groupResultsByRatingMonth(results: Result[], type: RatingType, now: Date = new Date()): MonthlyData[] {
  const currentMonth = getRatingMonthFromDate(now);
  const grouped = new Map<string, MonthlyData>();
  for (const original of results) {
    if (original.ratingType !== type) continue;
    const result = migrateResultRatingMonth(original);
    const monthKey = result.ratingMonth!;
    let month = grouped.get(monthKey);
    if (!month) {
      month = { monthKey, month: getRatingMonthDisplayName(monthKey), results: [], totalChange: 0, gameCount: 0, isCurrentMonth: monthKey === currentMonth, isReadOnly: monthKey !== currentMonth };
      grouped.set(monthKey, month);
    }
    month.results.push(result);
    month.totalChange += result.ratingChange;
    month.gameCount++;
  }
  return [...grouped.values()]
    .map(month => ({ ...month, totalChange: Math.round(month.totalChange * 100) / 100 }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
