import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Result, RatingType, MonthlyData } from '../../supabase/types';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to generate month key
export function generateMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${year}-${month}`;
}

// Helper function to get month display name
export function getMonthDisplayName(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(`${month} 1, ${year}`);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Helper function to check if month is current month
export function isCurrentMonth(monthKey: string): boolean {
  return monthKey === generateMonthKey();
}

// Helper function to check if month is read-only (previous months)
export function isReadOnlyMonth(monthKey: string): boolean {
  return !isCurrentMonth(monthKey);
}

export function useSupabaseRatingList(type: RatingType = 'standard') {
  const [results, setResults] = useState<Result[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeProfile } = useAuth();

  // Load games from Supabase
  const loadGames = useCallback(async () => {
    if (!activeProfile) {
      setResults([]);
      setMonthlyData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('user_profile_id', activeProfile.id)
        .eq('rating_type', type)
        .order('game_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Convert database games to Result format for backward compatibility
      const convertedResults: Result[] = (data || []).map((game: { id: string; player_rating: number; opponent_name: string; opponent_rating: number; k_factor: number; result: string; rating_change: number; rating_type: string; game_date: string; month_key: string }) => ({
        id: game.id as string,
        playerRating: game.player_rating as number,
        opponentName: game.opponent_name as string,
        opponentRating: game.opponent_rating as number,
        kFactor: game.k_factor as number,
        result: game.result as 'win' | 'draw' | 'loss',
        ratingChange: game.rating_change as number,
        ratingType: game.rating_type as 'standard' | 'blitz' | 'rapid',
        date: game.game_date as string,
        monthKey: game.month_key as string,
      }));

      setResults(convertedResults);

      // Group results by month
      const monthlyGroups: Record<string, Result[]> = {};
      convertedResults.forEach(result => {
        const monthKey = result.monthKey || generateMonthKey(new Date(result.date));
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = [];
        }
        monthlyGroups[monthKey].push(result);
      });

      // Convert to MonthlyData format
      const monthlyDataArray: MonthlyData[] = Object.entries(monthlyGroups).map(([monthKey, monthResults]) => {
        const totalChange = Math.round(100 * monthResults.reduce((acc, curr) => acc + curr.ratingChange, 0)) / 100;
        return {
          monthKey,
          month: getMonthDisplayName(monthKey),
          results: monthResults,
          totalChange,
          gameCount: monthResults.length,
          isCurrentMonth: isCurrentMonth(monthKey),
          isReadOnly: isReadOnlyMonth(monthKey),
        };
      });

      // Sort by month (newest first)
      monthlyDataArray.sort((a, b) => {
        const [yearA, monthA] = a.monthKey.split('-');
        const [yearB, monthB] = b.monthKey.split('-');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateB.getTime() - dateA.getTime();
      });

      setMonthlyData(monthlyDataArray);
    } catch (err) {
      console.error('Error loading games:', err);
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [activeProfile, type]);

  // Load games when activeProfile or type changes
  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const addResult = useCallback(async (result: Result) => {
    if (!activeProfile) {
      console.error('No active profile available');
      return;
    }

    try {
      setError(null);

      // Generate month key from the game date
      const monthKey = result.monthKey || generateMonthKey(new Date(result.date));

      const gameData = {
        user_profile_id: activeProfile.id,
        rating_type: type,
        month_key: monthKey,
        player_rating: result.playerRating,
        opponent_name: result.opponentName,
        opponent_rating: result.opponentRating,
        k_factor: result.kFactor,
        result: result.result,
        rating_change: result.ratingChange,
        game_date: result.date,
      };

      const { data, error: insertError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add to local state
      const newResult: Result = {
        id: data.id as string,
        playerRating: data.player_rating as number,
        opponentName: data.opponent_name as string,
        opponentRating: data.opponent_rating as number,
        kFactor: data.k_factor as number,
        result: data.result as 'win' | 'draw' | 'loss',
        ratingChange: data.rating_change as number,
        date: data.game_date as string,
        monthKey: data.month_key as string,
      };

      setResults(prev => [...prev, newResult]);
      
      // Reload to update monthly data
      await loadGames();
    } catch (err) {
      console.error('Error adding game:', err);
      setError(err instanceof Error ? err.message : 'Failed to add game');
    }
  }, [activeProfile, type, loadGames]);

  const removeResult = useCallback(async (index: number) => {
    const resultToRemove = results[index];
    if (!resultToRemove?.id) {
      console.error('No result ID to remove');
      return;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('id', resultToRemove.id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setResults(prev => prev.filter((_, i) => i !== index));
      
      // Reload to update monthly data
      await loadGames();
    } catch (err) {
      console.error('Error removing game:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove game');
    }
  }, [results, loadGames]);

  const updateResult = useCallback(async (index: number, updates: Partial<Result>) => {
    const resultToUpdate = results[index];
    if (!resultToUpdate?.id) {
      console.error('No result ID to update');
      return;
    }

    try {
      setError(null);

      const updateData: Record<string, unknown> = {};
      if (updates.playerRating !== undefined) updateData.player_rating = updates.playerRating;
      if (updates.opponentName !== undefined) updateData.opponent_name = updates.opponentName;
      if (updates.opponentRating !== undefined) updateData.opponent_rating = updates.opponentRating;
      if (updates.kFactor !== undefined) updateData.k_factor = updates.kFactor;
      if (updates.result !== undefined) updateData.result = updates.result;
      if (updates.ratingChange !== undefined) updateData.rating_change = updates.ratingChange;
      if (updates.date !== undefined) updateData.game_date = updates.date;
      if (updates.monthKey !== undefined) updateData.month_key = updates.monthKey;

      const { data, error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', resultToUpdate.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

              // Update local state
        const updatedResult: Result = {
          id: data.id as string,
          playerRating: data.player_rating as number,
          opponentName: data.opponent_name as string,
          opponentRating: data.opponent_rating as number,
          kFactor: data.k_factor as number,
          result: data.result as 'win' | 'draw' | 'loss',
          ratingChange: data.rating_change as number,
          date: data.game_date as string,
          monthKey: data.month_key as string,
        };

      setResults(prev => prev.map((r, i) => i === index ? updatedResult : r));
      
      // Reload to update monthly data
      await loadGames();
    } catch (err) {
      console.error('Error updating game:', err);
      setError(err instanceof Error ? err.message : 'Failed to update game');
    }
  }, [results, loadGames]);

  const setAllResults = useCallback(async (newResults: Result[]) => {
    if (!activeProfile) {
      console.error('No active profile available');
      return;
    }

    try {
      setError(null);

      // Delete existing games for this profile and type
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('user_profile_id', activeProfile.id)
        .eq('rating_type', type);

      if (deleteError) {
        throw deleteError;
      }

      // Insert new games
      if (newResults.length > 0) {
        const gameData = newResults.map(result => ({
          user_profile_id: activeProfile.id,
          rating_type: type,
          month_key: result.monthKey || generateMonthKey(new Date(result.date)),
          player_rating: result.playerRating,
          opponent_name: result.opponentName,
          opponent_rating: result.opponentRating,
          k_factor: result.kFactor,
          result: result.result,
          rating_change: result.ratingChange,
          game_date: result.date,
        }));

        const { error: insertError } = await supabase
          .from('games')
          .insert(gameData)

        if (insertError) {
          throw insertError;
        }
      }

      // Update local state
      setResults(newResults);
      
      // Reload to update monthly data
      await loadGames();
    } catch (err) {
      console.error('Error setting all results:', err);
      setError(err instanceof Error ? err.message : 'Failed to update games');
    }
  }, [activeProfile, type, loadGames]);

  return {
    results,
    monthlyData,
    loading,
    error,
    addResult,
    removeResult,
    updateResult,
    setAllResults,
    refetch: loadGames,
  };
}
