import { useState, useEffect, useCallback } from 'react';
import { RatingType } from '@/util/types';

export interface FidePlayer {
  fideId: string;
  name: string;
  title: string;
  trainerTitle: string;
  federation: string;
  standard: string;
  rapid: string;
  blitz: string;
  birthYear: string;
}

// Helper to get the correct rating for the current type, with fallback
function getPlayerRatingForType(player: FidePlayer, type: RatingType): string {
  let rating = '';
  if (type === 'standard') rating = player.standard;
  else if (type === 'blitz') rating = player.blitz;
  else if (type === 'rapid') rating = player.rapid;
  if (!rating || rating === '-') rating = player.standard || player.rapid || player.blitz || '';
  return rating && rating !== '-' ? rating : '';
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

async function fetchAndCacheFidePlayer(keyword: string): Promise<FidePlayer | null> {
  if (!keyword || keyword.trim() === '') return null;
  
  const cacheKey = `fide_player_${keyword}_${getCurrentMonthKey()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  try {
    const url = `https://ratings.fide.com/incl_search_l.php?search=${encodeURIComponent(keyword)}&simple=1`;
    const response = await fetch('https://no-cors.fly.dev/cors/' + url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (!response.ok) {
      console.warn('FIDE search failed:', response.status, response.statusText);
      return null;
    }
    const html = await response.text();
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('#table_results');
    if (!table) {
      console.warn('No results table found in FIDE response');
      return null;
    }
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    if (rows.length === 0) {
      console.warn('No player rows found in FIDE response');
      return null;
    }
    const players = rows.map((row) => {
      const cells = row.querySelectorAll('td');
      return {
        fideId: cells[0]?.textContent?.trim() || '',
        name: cells[1]?.textContent?.trim() || '',
        title: cells[2]?.textContent?.trim() || '',
        trainerTitle: cells[3]?.textContent?.trim() || '',
        federation: cells[4]?.textContent?.replace(/[\n\r]+/g, '').replace(/.*([A-Z]{3})$/, '$1').trim() || '',
        standard: cells[5]?.textContent?.trim() || '',
        rapid: cells[6]?.textContent?.trim() || '',
        blitz: cells[7]?.textContent?.trim() || '',
        birthYear: cells[8]?.textContent?.trim() || '',
      };
    });
    console.log(`FIDE search for "${keyword}" returned ${players.length} players:`, players.map(p => p.name));
    
    const player = players.find(p => p.name.toLowerCase() === keyword.toLowerCase());
    if (player) { localStorage.setItem(cacheKey, JSON.stringify(player)); return player; }
    // If no exact match, return the first result if any (for partial matches)
    if (players.length > 0) { localStorage.setItem(cacheKey, JSON.stringify(players[0])); return players[0]; }
    return null;
  } catch (error) {
    console.error('Error fetching FIDE player:', error);
    return null;
  }
}

export function usePlayerInfo(initialName: string, type: RatingType) {
  const [playerName, setPlayerName] = useState(initialName);
  const [playerInfo, setPlayerInfo] = useState<FidePlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlayer = useCallback(async (name: string) => {
    setLoading(true);
    setError('');
    const player = await fetchAndCacheFidePlayer(name);
    setPlayerInfo(player);
    setLoading(false);
    if (!player) setError('Player not found');
  }, []);

  // Update internal playerName when initialName changes
  useEffect(() => {
    if (initialName !== playerName) {
      setPlayerName(initialName);
    }
  }, [initialName, playerName]);

  useEffect(() => {
    const windowWithRefetch = window as Window & { playerInfoRefetch?: () => void };
    windowWithRefetch.playerInfoRefetch = () => fetchPlayer(playerName);
    return () => { 
      delete windowWithRefetch.playerInfoRefetch; 
    };
  }, [fetchPlayer, playerName]);

  // Fetch player data when playerName changes
  useEffect(() => {
    if (playerName) {
      // Clear previous data before fetching new data
      setPlayerInfo(null);
      setError('');
      fetchPlayer(playerName);
    } else {
      // Clear data if no player name
      setPlayerInfo(null);
      setError('');
    }
  }, [playerName, fetchPlayer]);

  const getRating = useCallback(() => {
    if (!playerInfo) return '';
    return getPlayerRatingForType(playerInfo, type);
  }, [playerInfo, type]);

  return {
    playerName,
    setPlayerName,
    playerInfo,
    loading,
    error,
    getRating,
    refetch: () => fetchPlayer(playerName),
  };
} 