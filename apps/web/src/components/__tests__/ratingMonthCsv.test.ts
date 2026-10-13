import { exportRatingCsv, importRatingCsv } from '../ratingMonthCsv';
const game = { id: 'one', date: '2025-12-31', ratingMonth: '2026-01', monthKey: '2026-01', playerRating: 1800, opponentName: 'A; "Player"', opponentRating: 1700, kFactor: 20, result: 'win' as const, ratingChange: 5, ratingType: 'rapid' as const };
it('round trips independent rating month, date and quoted opponent name', () => {
  const [restored] = importRatingCsv(exportRatingCsv([game]), 'standard');
  expect(restored).toMatchObject({ date: game.date, ratingMonth: '2026-01', monthKey: '2026-01', opponentName: game.opponentName, ratingType: 'rapid' });
});
it('migrates legacy date-only CSV', () => {
  const [restored] = importRatingCsv('Date,Player Rating,Opponent Name,Opponent Rating,K-Factor,Result,Rating Change\n2025-12-31;1800;Player;1700;20;win;5', 'standard');
  expect(restored.ratingMonth).toBe('2025-12');
});
it('preserves assigned legacy month keys', () => {
  const [restored] = importRatingCsv('Date;Player Rating;Opponent Name;Opponent Rating;K-Factor;Result;Rating Change;Month Key\n2025-12-31;1800;Player;1700;20;win;5;2026-Jan', 'standard');
  expect(restored.ratingMonth).toBe('2026-01');
});
it.each(['2026-13', '2026-Jan', ''])('rejects invalid explicit month %s', month => {
  expect(() => importRatingCsv(`Date;Player Rating;Opponent Name;Opponent Rating;K-Factor;Result;Rating Change;Rating Month\n2025-12-31;1800;Player;1700;20;win;5;${month}`, 'standard')).toThrow(/rating month/i);
});
