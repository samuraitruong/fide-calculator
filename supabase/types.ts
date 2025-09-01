export type GameResult = 'win' | 'draw' | 'loss';
export type RatingType = 'standard' | 'blitz' | 'rapid';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          fide_id: string | null;
          title: string | null;
          federation: string | null;
          birth_year: number | null;
          standard_rating: number;
          rapid_rating: number;
          blitz_rating: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          fide_id?: string | null;
          title?: string | null;
          federation?: string | null;
          birth_year?: number | null;
          standard_rating?: number;
          rapid_rating?: number;
          blitz_rating?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          fide_id?: string | null;
          title?: string | null;
          federation?: string | null;
          birth_year?: number | null;
          standard_rating?: number;
          rapid_rating?: number;
          blitz_rating?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          user_profile_id: string;
          rating_type: RatingType;
          month_key: string;
          player_rating: number;
          opponent_name: string;
          opponent_rating: number;
          k_factor: number;
          result: GameResult;
          rating_change: number;
          game_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_profile_id: string;
          rating_type: RatingType;
          month_key: string;
          player_rating: number;
          opponent_name: string;
          opponent_rating: number;
          k_factor: number;
          result: GameResult;
          rating_change: number;
          game_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_profile_id?: string;
          rating_type?: RatingType;
          month_key?: string;
          player_rating?: number;
          opponent_name?: string;
          opponent_rating?: number;
          k_factor?: number;
          result?: GameResult;
          rating_change?: number;
          game_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Legacy Result interface for backward compatibility
export interface Result {
  id?: string;
  playerRating: number;
  opponentName: string;
  opponentRating: number;
  kFactor: number;
  result: GameResult;
  ratingChange: number;
  date: string;
  monthKey?: string;
}

// Monthly data interface
export interface MonthlyData {
  monthKey: string;
  month: string; // Display name like "August 2025"
  results: Result[];
  totalChange: number;
  gameCount: number;
  isCurrentMonth: boolean;
  isReadOnly: boolean;
}

// User Profile interface (multiple profiles per user)
export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  fideId?: string;
  title?: string;
  federation?: string;
  birthYear?: number;
  standardRating: number;
  rapidRating: number;
  blitzRating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Game interface
export interface Game {
  id: string;
  userProfileId: string;
  ratingType: RatingType;
  monthKey: string;
  playerRating: number;
  opponentName: string;
  opponentRating: number;
  kFactor: number;
  result: GameResult;
  ratingChange: number;
  gameDate: string;
  createdAt: string;
  updatedAt: string;
}
