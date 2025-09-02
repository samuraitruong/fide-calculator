'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { calculateRatingChange } from '../util/util';

import CurrentChangeBox from '@/components/CurrentChangeBox';
import PrintTotalChange from '@/components/PrintTotalChange';
import { useSupabaseRatingList } from '@/hooks/useSupabaseRatingList';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { GameResult, Result, RatingType, MonthlyData } from '@/util/types';
import InfoPopup from '@/components/InfoPopup';
import KFactorHelp from '@/components/KFactorHelp';
import MonthlyRatingList from '@/components/MonthlyRatingList';
import Snackbar from '@/components/Snackbar';
import Confirm from '@/components/Confirm';
import { FaCalculator, FaSave } from 'react-icons/fa';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { useConfirm } from '@/hooks/useConfirm';
import { useFideData } from '@/hooks/useFideData';
import type { FidePlayer } from '@/hooks/useFideData';
import LiveRatingBox from '@/components/LiveRatingBox';
import { useAuth } from '@/contexts/AuthContext';
import MonthlyView from '@/components/MonthlyView';

interface FideCalculatorProps {
  type: RatingType;
}

// Helper to get the correct rating for the current type, with fallback
function getPlayerRatingForType(player: FidePlayer, type: RatingType): string {
  // Try the selected type first
  let rating = '';
  if (type === 'standard') {
    rating = player.standard;
  } else if (type === 'blitz') {
    rating = player.blitz;
  } else if (type === 'rapid') {
    rating = player.rapid;
  }
  // Fallback order: standard > rapid > blitz
  if (!rating || rating === '-') {
    rating = player.standard || player.rapid || player.blitz || '';
  }
  return rating && rating !== '-' ? rating : '';
}

export default function FideCalculator({ type }: FideCalculatorProps) {
  // Determine storage mode
  const storageMode = localStorage.getItem('fide-calculator-mode') === 'local' ? 'local' : 'cloud';
  
  // Use appropriate storage system based on mode
  const {
    results: cloudResults,
    monthlyData: cloudMonthlyData,
    addResult: cloudAddResult,
    removeResult: cloudRemoveResult,
    updateResult: cloudUpdateResult,
    setAllResults: cloudSetAllResults,
  } = useSupabaseRatingList(type);

  const {
    results: localResults,
    addResult: localAddResult,
    removeResult: localRemoveResult,
    updateResult: localUpdateResult,
    setAllResults: localSetAllResults,
    generateMonthlyData,
  } = useLocalStorage();

  // Use the appropriate data and functions based on storage mode
  const results = storageMode === 'local' ? localResults : cloudResults;
  
  // Make monthly data reactive using useMemo
  const monthlyData = useMemo(() => {
    if (storageMode === 'local') {
      return generateMonthlyData(type);
    } else {
      return cloudMonthlyData;
    }
  }, [storageMode, generateMonthlyData, type, cloudMonthlyData]);
  
  const addResult = storageMode === 'local' ? localAddResult : cloudAddResult;
  const updateResult = storageMode === 'local' ? localUpdateResult : cloudUpdateResult;
  const setAllResults = storageMode === 'local' ? localSetAllResults : cloudSetAllResults;

  // Create a wrapper function for removeResult that handles both local and cloud modes
  const handleRemoveResult = useCallback((indexOrId: number | string) => {
    console.log('handleRemoveResult called with:', indexOrId, 'storageMode:', storageMode);
    if (storageMode === 'local') {
      // Local mode: can handle both index and ID
      console.log('Calling localRemoveResult with:', indexOrId);
      localRemoveResult(indexOrId);
    } else {
      // Cloud mode: expects index
      if (typeof indexOrId === 'number') {
        console.log('Calling cloudRemoveResult with:', indexOrId);
        cloudRemoveResult(indexOrId);
      }
    }
  }, [storageMode, localRemoveResult, cloudRemoveResult]);

  // Debug logging
  useEffect(() => {
    console.log('FideCalculator: Storage mode:', storageMode);
    console.log('FideCalculator: Results count:', results?.length || 0);
    console.log('FideCalculator: Monthly data count:', monthlyData?.length || 0);
    console.log('FideCalculator: Current type:', type);
  }, [storageMode, results, monthlyData, type]);

  const { isOpen: confirmOpen, title: confirmTitle, message: confirmMessage, openConfirm, handleConfirm, handleCancel } = useConfirm();

  // Set default K based on type
  const getDefaultK = (type: RatingType) => (type === 'standard' ? 40 : 20);

  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  // On first load, use profile rating, else last saved result, else default
  const getInitialPlayerRating = () => {
    if (Array.isArray(results) && results.length > 0) {
      return results[results.length - 1].playerRating;
    }
    return 1888;
  };
  const [playerRating, setPlayerRating] = useState<number>(getInitialPlayerRating());
  const [kFactor, setKFactor] = useState<number>(getDefaultK(type));
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentRating, setOpponentRating] = useState<number>(1400);
  const [result, setResult] = useState<GameResult>('win');
  const [totalChange, setTotalChange] = useState<number>(0);
  const [currentRatingChange, setCurrentRatingChange] = useState<number | null>(null);
  const [showOpponentDropdown, setShowOpponentDropdown] = useState(false);
  const [opponentSearch, setOpponentSearch] = useState('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    type: 'success'
  });
  const [selectedMonthData, setSelectedMonthData] = useState<MonthlyData | null>(null);
  // Removed useFideData and related code
  const inputRef = useRef<HTMLInputElement>(null);
  const [playerRatingManuallyChanged, setPlayerRatingManuallyChanged] = useState(false);

  const debouncedOpponentSearch = useDebouncedValue(opponentSearch, 500);
  const { fideData, loading: fideLoading, search: fideSearch } = useFideData('');

  // Use the auth hook to get active profile
  const { activeProfile } = useAuth();



  // Sync player rating with profile unless manually changed
  useEffect(() => {
    if (!playerRatingManuallyChanged) {
      // Use profile rating based on type
      if (activeProfile) {
        let rating = 1500; // Default fallback
        if (type === 'standard') {
          rating = activeProfile.standardRating;
        } else if (type === 'rapid') {
          rating = activeProfile.rapidRating;
        } else if (type === 'blitz') {
          rating = activeProfile.blitzRating;
        }
        setPlayerRating(rating);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, type]);

  // If user changes player rating manually, set flag
  const handlePlayerRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerRating(Number(e.target.value));
    setPlayerRatingManuallyChanged(true);
  };

  const isValidRating = (rating: number) => rating >= 1400 && rating <= 3500;
  const isFormValid = isValidRating(playerRating) && isValidRating(opponentRating);

  const handleCalculate = () => {
    if (!isFormValid) return;
    const ratingChange = calculateRatingChange(playerRating, opponentRating, result, kFactor);
    setCurrentRatingChange(ratingChange);
  };

  const handleTrack = () => {
    if (!isFormValid) return;
    const ratingChange = calculateRatingChange(playerRating, opponentRating, result, kFactor);
    setCurrentRatingChange(ratingChange);
    
    const newResult: Result = {
      id: selectedResult?.id || (Date.now().toString() + Math.random().toString().slice(2)),
      ...(selectedResult || {}),
      playerRating,
      opponentName,
      opponentRating,
      kFactor,
      result,
      ratingChange,
      ratingType: type,
      date: selectedResult?.date || new Date().toLocaleDateString('en-CA'), // Use YYYY-MM-DD format for consistency
      monthKey: selectedResult?.monthKey || `${new Date().getFullYear()}-${new Date().toLocaleDateString('en-US', { month: 'short' })}`
    };

    if (selectedResult) {
      // Update existing result
      const index = results.findIndex(r => r.id === selectedResult.id);
      if (index !== -1) {
        updateResult(index, newResult);
      }
    } else {
      // Add new result
      addResult(newResult);
    }
    // Reset form after add/update, but preserve player rating from profile
    setSelectedResult(null);
    if (activeProfile) {
      let rating = 1500; // Default fallback
      if (type === 'standard') {
        rating = activeProfile.standardRating;
      } else if (type === 'rapid') {
        rating = activeProfile.rapidRating;
      } else if (type === 'blitz') {
        rating = activeProfile.blitzRating;
      }
      setPlayerRating(rating);
    } else {
      setPlayerRating(1500);
    }
    setOpponentName('');
    setOpponentRating(1400);
    setKFactor(getDefaultK(type));
    setResult('win');
    setCurrentRatingChange(null);
  };

  const handleRemove = (index: number) => {
    // Find the actual result to remove from the monthly data
    if (monthlyData && monthlyData.length > 0) {
      // Find which month contains the result at this index
      let foundResult: Result | null = null;
      let globalIndex = -1;
      
      // Calculate the global index across all months
      for (const month of monthlyData) {
        if (index < month.results.length) {
          foundResult = month.results[index];
          // Find the global index in the main results array
          globalIndex = results.findIndex(r => r.id === foundResult?.id);
          break;
        }
        index -= month.results.length;
      }
      
      if (foundResult && foundResult.id) {
        if (storageMode === 'local') {
          // Local mode: pass the ID
          handleRemoveResult(foundResult.id);
        } else {
          // Cloud mode: pass the global index
          if (globalIndex !== -1) {
            handleRemoveResult(globalIndex);
          }
        }
      }
    }
  };

  const handleUpdateDate = (index: number, date: string) => {
    updateResult(index, { date });
  };

  const handleResultChange = (option: GameResult) => {
    setResult(option);
    if (isFormValid) {
      const ratingChange = calculateRatingChange(playerRating, opponentRating, option, kFactor);
      setCurrentRatingChange(ratingChange);
    }
  };

  // When user types in opponent name, update search
  const handleOpponentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpponentName(e.target.value);
    setOpponentSearch(e.target.value);
    setShowOpponentDropdown(true);
  };

  // When user selects a player from dropdown
  const handleSelectOpponent = (name: string, player: FidePlayer) => {
    const rating = getPlayerRatingForType(player, type);
    setOpponentName(name);
    setOpponentRating(Number(rating) || 1400);
    setShowOpponentDropdown(false);
    inputRef.current?.blur();
  };

  // Restore search functionality: trigger FIDE search when debouncedOpponentSearch changes
  useEffect(() => {
    if (debouncedOpponentSearch && showOpponentDropdown) {
      fideSearch(debouncedOpponentSearch);
    }
  }, [debouncedOpponentSearch, showOpponentDropdown, fideSearch]);

  // Handler for selecting a result from the list
  const handleSelectResult = (result: Result) => {
    setPlayerRating(result.playerRating);
    setOpponentName(result.opponentName);
    setOpponentRating(result.opponentRating);
    setKFactor(result.kFactor);
    setResult(result.result);
    setCurrentRatingChange(result.ratingChange);
    setSelectedResult(result);
    // Optionally scroll to form
    const formSection = document.getElementById('fide-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler for row reordering
  const handleReorder = (newResults: Result[]) => {
    setAllResults(newResults);
  };



  const handleReset = () => {
    // Clear all results
    setAllResults([]);
    // Reset form state
    setSelectedResult(null);
    setCurrentRatingChange(null);
    // After reset, use profile rating if available
    if (activeProfile) {
      let rating = 1500; // Default fallback
      if (type === 'standard') {
        rating = activeProfile.standardRating;
      } else if (type === 'rapid') {
        rating = activeProfile.rapidRating;
      } else if (type === 'blitz') {
        rating = activeProfile.blitzRating;
      }
      setPlayerRating(rating);
    } else {
      setPlayerRating(1500);
    }
    // Show success message
    setSnackbar({
      open: true,
      message: 'Data reset successfully!',
      type: 'success'
    });
  };

  const handleResetClick = () => {
    if (results.length === 0) {
      setSnackbar({
        open: true,
        message: 'No data to reset.',
        type: 'info'
      });
      return;
    }

    openConfirm(
      'Reset All Data',
      'This will create a backup of your current data and then remove all entries. Are you sure you want to continue?'
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleViewDetails = () => {
    // Find the current month's data
    const currentMonth = monthlyData.find(month => month.isCurrentMonth);
    if (currentMonth) {
      setSelectedMonthData(currentMonth);
    }
  };

  const handleCloseViewDetailsModal = () => {
    setSelectedMonthData(null);
  };



  const getTypeDisplayName = (type: RatingType) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'blitz': return 'Blitz';
      case 'rapid': return 'Rapid';
      default: return type;
    }
  };

  useEffect(() => {
    setTotalChange(Math.round(100 * results.reduce((acc, curr) => acc + curr.ratingChange, 0)) / 100);
  }, [results]);



  return (
    <div className="min-h-screen p-1 md:p-5 bg-gray-50 max-w-7xl mx-auto">

      {/* Print CSS moved to CSS module */}
      <PrintTotalChange totalChange={totalChange} />
      {/* Form and current change box on top */}

      <div className='flex flex-col md:flex-row w-full max-w-7xl gap-3'>
        <div className="w-full md:w-2/3 p-1">
          <div id="fide-form-section" className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-2xl shadow-xl border border-blue-100/50 p-6 w-full h-full print:hidden backdrop-blur-sm">
            {/* Header with gradient accent */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-3 shadow-lg">
                <span className="text-white text-xl font-bold">♔</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                {getTypeDisplayName(type)} Rating Calculator
              </h1>
              <p className="text-gray-600 mt-1 text-xs">Calculate your FIDE rating changes</p>
            </div>

            {/* Form Grid Layout */}
            <div className="space-y-4">
              {/* Top Row: Player Rating & K-Factor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player Rating Card */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Player Rating
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-medium text-base transition-all duration-200 hover:border-blue-300 group-hover:shadow-md"
                      value={playerRating}
                      onChange={handlePlayerRatingChange}
                      placeholder="Enter rating"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                    </div>
                  </div>
                </div>

                {/* K-Factor Card */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    K-Factor
                    <InfoPopup
                      title="Help notes"
                      content={<KFactorHelp />}
                    />
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 font-medium text-base transition-all duration-200 hover:border-purple-300 group-hover:shadow-md appearance-none cursor-pointer"
                      value={kFactor}
                      onChange={(e) => setKFactor(Number(e.target.value))}
                    >
                      <option value={40}>40 - Standard</option>
                      <option value={20}>20 - Rapid/Blitz</option>
                      <option value={10}>10 - High Rated</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Row: Opponent Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opponent Name Card */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Opponent Name
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full px-3 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-gray-900 font-medium text-base transition-all duration-200 hover:border-green-300 group-hover:shadow-md"
                      value={opponentName}
                      onChange={handleOpponentNameChange}
                      onFocus={() => setShowOpponentDropdown(true)}
                      autoComplete="off"
                      placeholder="Search FIDE player or enter name"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full opacity-60"></div>
                    </div>
                    
                    {/* Enhanced Dropdown */}
                    {showOpponentDropdown && opponentSearch && (
                      <div className="absolute z-20 left-0 right-0 bg-white/95 backdrop-blur-sm border-2 border-green-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto mt-1">
                        {fideLoading ? (
                          <div className="p-3 text-gray-500 text-center">
                            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            Searching FIDE database...
                          </div>
                        ) : (
                          fideData.length > 0 ? (
                            fideData.map((player) => {
                              const rating = getPlayerRatingForType(player, type);
                              return (
                                <button
                                  key={player.fideId + player.name}
                                  className="w-full text-left px-3 py-2 hover:bg-green-50 focus:bg-green-100 focus:outline-none flex justify-between items-center text-gray-800 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                  onClick={() => handleSelectOpponent(player.name, player)}
                                  type="button"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 text-sm">{player.name}</span>
                                    <span className="text-xs text-gray-500">{player.federation}</span>
                                  </div>
                                  <span className="text-base font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                    {rating || '—'}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-gray-500 text-center">
                              <div className="w-6 h-6 mx-auto mb-1 text-gray-400">🔍</div>
                              No players found
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Opponent Rating Card */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Opponent Rating
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 font-medium text-base transition-all duration-200 hover:border-orange-300 group-hover:shadow-md"
                      value={opponentRating}
                      onChange={(e) => setOpponentRating(Number(e.target.value))}
                      placeholder="Enter rating"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full opacity-60"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Selection */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Game Result
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['win', 'draw', 'loss'] as GameResult[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`relative px-4 py-3 rounded-lg font-bold text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 transform hover:scale-105 active:scale-95 ${
                        option === result
                          ? option === 'win'
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                            : option === 'draw'
                            ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30'
                            : 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => handleResultChange(option)}
                      aria-pressed={result === option}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl">
                          {option === 'win' ? '🏆' : option === 'draw' ? '🤝' : '💔'}
                        </span>
                        <span className="font-bold text-sm">{option.toUpperCase()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <button
                  className="group relative px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-base hover:from-blue-600 hover:to-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FaCalculator className="text-lg group-hover:rotate-12 transition-transform duration-200" />
                    <span>Calculate</span>
                  </div>
                </button>
                
                <button
                  className="group relative px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-base hover:from-green-600 hover:to-green-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/30 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  onClick={handleTrack}
                  disabled={!isFormValid}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FaSave className="text-lg group-hover:scale-110 transition-transform duration-200" />
                    <span>Save Result</span>
                  </div>
                </button>
              </div>

              {/* Validation Error */}
              {(!isValidRating(playerRating) || !isValidRating(opponentRating)) && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-red-700 font-medium">
                      Player and Opponent ratings must be between 1400 and 3500.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3 p-1 print:hidden">
          <div className="bg-white rounded-xl shadow-lg p-2 nd:p-4 border border-gray-100 h-full">
            <div className="space-y-5 h-full">
              {/* Current Change Box - Always visible at top (calculated result) */}
              <div className="flex-1">
                {currentRatingChange !== null ? (
                  <CurrentChangeBox currentRatingChange={currentRatingChange} />
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaCalculator className="text-lg text-gray-300" />
                    </div>
                    <p className="text-xs font-medium">Calculate rating change</p>
                    <p className="text-xs text-gray-400 mt-1">Fill the form and click Calculate</p>
                  </div>
                )}
              </div>
              
              {/* Live Rating Box - Always visible at bottom (total progress) */}
              <div className="flex-1">
                <LiveRatingBox currentRatingChange={totalChange} currentRating={playerRating} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <MonthlyRatingList
        monthlyData={monthlyData}
        onRemove={handleRemove}
        onSelect={handleSelectResult}
        onUpdateDate={handleUpdateDate}
        onReorder={handleReorder}
        onReset={handleResetClick}
        onViewDetails={handleViewDetails}
        type={type}
      />



      {/* Reset Confirmation Modal */}
      <Confirm
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={() => handleConfirm(handleReset)}
        onCancel={() => handleCancel(() => { })}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={handleCloseSnackbar}
      />

      {/* Monthly View Modal */}
      <MonthlyView
        monthlyData={selectedMonthData}
        onClose={handleCloseViewDetailsModal}
      />


    </div>
  );
}