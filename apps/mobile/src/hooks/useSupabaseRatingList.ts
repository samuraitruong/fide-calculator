import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Result, RatingType } from '@fide-calculator/shared';
import { useAuth } from '@/contexts/AuthContext';

import { getRatingMonthFromDate, getRatingMonthDisplayName, migrateResultRatingMonth, groupResultsByRatingMonth } from '@fide-calculator/shared';

const gameChangeSubscribers = new Set<() => Promise<void>>();

export const generateMonthKey = (date: Date = new Date()): string => getRatingMonthFromDate(date);
export const getMonthDisplayName = (month: string): string => getRatingMonthDisplayName(month);
export const isCurrentMonth = (month: string): boolean => month === generateMonthKey();
export const isReadOnlyMonth = (month: string): boolean => !isCurrentMonth(month);

export function useSupabaseRatingList(type: RatingType = 'standard') {
  const [results, setResults] = useState<Result[]>([]);
  const monthlyData = useMemo(() => groupResultsByRatingMonth(results, type), [results, type]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeProfile } = useAuth();

  // Load games from Supabase
  const loadGames = useCallback(async () => {
    if (!activeProfile) {
      setResults([]);
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
      const convertedResults: Result[] = (data || []).map(
        (game: {
          id: string;
          player_rating: number;
          opponent_name: string;
          opponent_rating: number;
          k_factor: number;
          result: string;
          rating_change: number;
          rating_type: string;
          game_date: string;
          month_key: string; rating_month?: string;
        }) => ({
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
          ratingMonth: game.rating_month,
        }),
      );

      const normalizedResults = convertedResults.map(migrateResultRatingMonth);
      setResults(normalizedResults);


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

  useEffect(() => {
    gameChangeSubscribers.add(loadGames);
    return () => { gameChangeSubscribers.delete(loadGames); };
  }, [loadGames]);

  const addResult = useCallback(
    async (result: Result) => {
      if (!activeProfile) {
        throw new Error('No active profile available');
      }

      try {
        setError(null);

        // Generate month key from the game date
        const normalizedResult = migrateResultRatingMonth(result);
        const monthKey = normalizedResult.ratingMonth!;

        const gameData = {
          user_profile_id: activeProfile.id,
          rating_type: type,
          rating_month: monthKey,
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
          ratingType: data.rating_type as RatingType,
          date: data.game_date as string,
          monthKey: data.month_key as string,
          ratingMonth: data.rating_month as string,
        };

        setResults((prev) => [...prev, migrateResultRatingMonth(newResult)]);

        // Reload to update monthly data
        await loadGames();
        gameChangeSubscribers.forEach(reload => {
          if (reload !== loadGames) void reload();
        });
      } catch (err) {
        console.error('Error adding game:', err);
        setError(err instanceof Error ? err.message : 'Failed to add game');
        throw err;
      }
    },
    [activeProfile, type, loadGames],
  );

  const removeResult = useCallback(
    async (index: number) => {
      const resultToRemove = results[index];
      if (!resultToRemove?.id) {
        throw new Error('No result ID to remove');
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
        setResults((prev) => prev.filter(result => result.id !== resultToRemove.id));

        // Reload to update monthly data
        await loadGames();
        gameChangeSubscribers.forEach(reload => {
          if (reload !== loadGames) void reload();
        });
      } catch (err) {
        console.error('Error removing game:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove game');
        throw err;
      }
    },
    [results, loadGames],
  );

  const updateResult = useCallback(
    async (index: number, updates: Partial<Result>) => {
      const resultToUpdate = results[index];
      if (!resultToUpdate?.id) {
        throw new Error('No result ID to update');
      }

      try {
        setError(null);

        const updateData: Record<string, unknown> = {};
        if (updates.playerRating !== undefined) updateData.player_rating = updates.playerRating;
        if (updates.opponentName !== undefined) updateData.opponent_name = updates.opponentName;
        if (updates.opponentRating !== undefined)
          updateData.opponent_rating = updates.opponentRating;
        if (updates.kFactor !== undefined) updateData.k_factor = updates.kFactor;
        if (updates.result !== undefined) updateData.result = updates.result;
        if (updates.ratingChange !== undefined)
          updateData.rating_change = updates.ratingChange;
        if (updates.date !== undefined) updateData.game_date = updates.date;
        if (updates.ratingMonth !== undefined || updates.monthKey !== undefined) {
          updateData.rating_month = migrateResultRatingMonth({
            ...resultToUpdate, ...updates,
            ratingMonth: updates.ratingMonth ?? undefined,
          }).ratingMonth;
        }

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
          ratingType: data.rating_type as RatingType,
          date: data.game_date as string,
          monthKey: data.month_key as string,
          ratingMonth: data.rating_month as string,
        };

        setResults((prev) => prev.map(r => (r.id === resultToUpdate.id ? migrateResultRatingMonth(updatedResult) : r)));

        // Reload to update monthly data
        await loadGames();
        gameChangeSubscribers.forEach(reload => {
          if (reload !== loadGames) void reload();
        });
      } catch (err) {
        console.error('Error updating game:', err);
        setError(err instanceof Error ? err.message : 'Failed to update game');
        throw err;
      }
    },
    [results, loadGames],
  );

  const setAllResults = useCallback(
    async (newResults: Result[]) => {
      if (!activeProfile) {
        throw new Error('No active profile available');
      }

      try {
        setError(null);

        newResults = newResults.map(migrateResultRatingMonth);

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
          const gameData = newResults.map((result) => ({
            user_profile_id: activeProfile.id,
            rating_type: type,
            rating_month: migrateResultRatingMonth(result).ratingMonth!,
            player_rating: result.playerRating,
            opponent_name: result.opponentName,
            opponent_rating: result.opponentRating,
            k_factor: result.kFactor,
            result: result.result,
            rating_change: result.ratingChange,
            game_date: result.date,
          }));

          const { error: insertError } = await supabase.from('games').insert(gameData);

          if (insertError) {
            throw insertError;
          }
        }

        // Update local state
        setResults(newResults);

        // Reload to update monthly data
        await loadGames();
        gameChangeSubscribers.forEach(reload => {
          if (reload !== loadGames) void reload();
        });
      } catch (err) {
        console.error('Error setting all results:', err);
        setError(err instanceof Error ? err.message : 'Failed to update games');
        throw err;
      }
    },
    [activeProfile, type, loadGames],
  );

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

