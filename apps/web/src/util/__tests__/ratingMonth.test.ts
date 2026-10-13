import * as helpers from '../../../../../packages/shared/src/ratingMonth';
import type { Result } from '../../../../../packages/shared/src/types';
const game = (fields: Partial<Result> = {}): Result => ({ playerRating: 1600, opponentName: 'Opponent', opponentRating: 1600, kFactor: 20, result: 'win', ratingChange: 10, ratingType: 'standard', date: '2025-12-31', ...fields });
describe('rating month', () => {
  test('validates explicit calendar months strictly', () => {
    for (const month of ['2026-01', '2026-12']) expect(helpers.isValidRatingMonth(month)).toBe(true);
    for (const month of [null, 202601, '2026-1', '2026-00', '2026-13', '2026-Jan', ' 2026-01', '2026-01\n']) expect(helpers.isValidRatingMonth(month)).toBe(false);
  });
  test('normalizes only valid legacy month assignments', () => {
    expect(helpers.normalizeRatingMonth('2026-Jan')).toBe('2026-01');
    expect(helpers.normalizeRatingMonth('2025-Dec')).toBe('2025-12');
    expect(helpers.normalizeRatingMonth('2026-04')).toBe('2026-04');
    expect(helpers.normalizeRatingMonth('2026-13')).toBeUndefined();
  });
  test('keeps calendar dates and local Date values in their written month', () => {
    expect(helpers.getRatingMonthFromDate('2026-01-01')).toBe('2026-01');
    expect(helpers.getRatingMonthFromDate('2026-01-01T00:00:00+11:00')).toBe('2026-01');
    expect(helpers.getRatingMonthFromDate(new Date(2026, 0, 1))).toBe('2026-01');
    expect(() => helpers.getRatingMonthFromDate('invalid')).toThrow();
  });
  test('migrates legacy slash dates by their written calendar month and rejects impossible dates', () => {
    expect(helpers.getRatingMonthFromDate('8/15/2026')).toBe('2026-08');
    expect(helpers.getRatingMonthFromDate('08/15/2026')).toBe('2026-08');
    expect(helpers.migrateResultRatingMonth(game({ date: '8/15/2026' }))).toMatchObject({ date: '8/15/2026', ratingMonth: '2026-08' });
    for (const date of ['2/30/2026', '13/15/2026', '08/00/2026', '08/32/2026', '02/29/2025', '2026-02-30']) {
      expect(() => helpers.getRatingMonthFromDate(date)).toThrow();
    }
    expect(helpers.getRatingMonthFromDate('02/29/2024')).toBe('2024-02');
  });
  test('rounds monthly totals to two decimals', () => {
    const [month] = helpers.groupResultsByRatingMonth([game({ ratingChange: 0.1 }), game({ ratingChange: 0.2 })], 'standard');
    expect(month.totalChange).toBe(0.3);
  });
  test('uses explicit month then legacy assignment then date, rejecting invalid explicit values', () => {
    expect(helpers.getResultRatingMonth(game({ ratingMonth: '2026-02', monthKey: '2026-Jan' }))).toBe('2026-02');
    expect(helpers.getResultRatingMonth(game({ monthKey: '2026-Jan' }))).toBe('2026-01');
    expect(helpers.getResultRatingMonth(game({ monthKey: 'invalid' }))).toBe('2025-12');
    expect(() => helpers.getResultRatingMonth(game({ ratingMonth: '2026-Jan' }))).toThrow();
  });
  test('migration preserves game date and is idempotent', () => {
    const original = game({ monthKey: '2026-Jan' });
    const migrated = helpers.migrateResultRatingMonth(original);
    expect(migrated).toEqual({ ...original, ratingMonth: '2026-01', monthKey: '2026-01' });
    expect(helpers.migrateResultRatingMonth(migrated)).toEqual(migrated);
    expect(original.ratingMonth).toBeUndefined();
  });
  test('groups live membership by assigned month and rating type, descending', () => {
    const rows = helpers.groupResultsByRatingMonth([game({ monthKey: '2026-Jan' }), game({ ratingMonth: '2025-12', ratingChange: -5 }), game({ ratingMonth: '2026-01', ratingType: 'blitz' })], 'standard', new Date(2026, 0, 5));
    expect(rows.map(row => row.monthKey)).toEqual(['2026-01', '2025-12']);
    expect(rows[0]).toMatchObject({ month: 'January 2026', totalChange: 10, gameCount: 1, isCurrentMonth: true, isReadOnly: false });
    expect(rows[1]).toMatchObject({ totalChange: -5, isCurrentMonth: false, isReadOnly: true });
    expect(rows[0].results[0].date).toBe('2025-12-31');
    expect(helpers.getRatingMonthDisplayName('2025-12')).toBe('December 2025');
  });
});
