export type GameResult = 'win' | 'draw' | 'loss';
export type RatingType = 'standard' | 'blitz' | 'rapid';

export interface Result {
  id?: string;
  playerRating: number;
  opponentName: string;
  opponentRating: number;
  kFactor: number;
  result: GameResult;
  ratingChange: number;
  ratingType: RatingType;
  date: string;
  monthKey?: string;
}

// Alias for compatibility with Supabase types
export interface Game extends Omit<Result, 'playerRating' | 'opponentName' | 'opponentRating' | 'kFactor' | 'ratingChange' | 'date'> {
  user_profile_id: string;
  rating_type: RatingType;
  month_key: string;
  player_rating: number;
  opponent_name: string;
  opponent_rating: number;
  k_factor: number;
  rating_change: number;
  game_date: string;
  created_at?: string;
  updated_at?: string;
}