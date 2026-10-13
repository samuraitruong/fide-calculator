import type { Result, RatingType } from '@/util/types';
import { isValidRatingMonth, migrateResultRatingMonth } from '@fide-calculator/shared';

const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ';' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = '';
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else field += char;
  }
  if (quoted) throw new Error('Invalid CSV: unclosed quoted value.');
  row.push(field); if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function exportRatingCsv(results: Result[]): string {
  return ['Date;Player Rating;Opponent Name;Opponent Rating;K-Factor;Result;Rating Change;Rating Month;Rating Type;Month Key', ...results.map(original => {
    const r = migrateResultRatingMonth(original);
    return [r.date, r.playerRating, r.opponentName, r.opponentRating, r.kFactor, r.result, r.ratingChange, r.ratingMonth, r.ratingType, r.monthKey].map(quote).join(';');
  })].join('\n');
}
export function importRatingCsv(text: string, type: RatingType): Result[] {
  const rows = parseCsv(text); if (rows.length < 2) return [];
  const header = rows[0].length === 1 ? rows[0][0].split(',') : rows[0];
  const names = header.map(name => name.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[ _-]/g, ''));
  const monthIndex = names.indexOf('ratingmonth');
  const keyIndex = names.indexOf('monthkey');
  const typeIndex = names.indexOf('ratingtype');
  return rows.slice(1).map((row, index) => {
    const [date, playerRating, opponentName, opponentRating, kFactor, result, ratingChange] = row;
    const ratingMonth = monthIndex >= 0 ? row[monthIndex]?.trim() : undefined;
    if (monthIndex >= 0 && !isValidRatingMonth(ratingMonth)) throw new Error(`Invalid rating month on CSV row ${index + 2}. Use YYYY-MM.`);
    const ratingType = typeIndex >= 0 ? row[typeIndex] : type;
    if (!date || !['win', 'draw', 'loss'].includes(result) || ![playerRating, opponentRating, kFactor, ratingChange].every(v => v?.trim() !== '' && Number.isFinite(Number(v))) || !['standard', 'rapid', 'blitz'].includes(ratingType)) throw new Error(`Invalid game on CSV row ${index + 2}.`);
    return migrateResultRatingMonth({ id: Date.now().toString() + Math.random().toString().slice(2), date, playerRating: Number(playerRating), opponentName, opponentRating: Number(opponentRating), kFactor: Number(kFactor), result: result as Result['result'], ratingChange: Number(ratingChange), ratingType: ratingType as RatingType, ratingMonth, monthKey: keyIndex >= 0 ? row[keyIndex] : undefined });
  });
}
