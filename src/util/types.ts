export type GameResult = 'win' | 'draw' | 'loss';

export interface Result {
  id?: string;
  playerRating: number;
  opponentName: string;
  opponentRating: number;
  kFactor: number;
  result: GameResult;
  ratingChange: number;
  date: string;
}