'use client';

import { useState, useEffect, useRef } from 'react';
import { calculateRatingChange } from '../util/util';
import ListRatingChange from '@/components/ListRatingChange';
import CurrentChangeBox from '@/components/CurrentChangeBox';
import PrintTotalChange from '@/components/PrintTotalChange';
import { useRatingList } from '@/hooks/useRatingList';
import { useBackup } from '@/hooks/useBackup';
import type { GameResult, Result, RatingType } from '@/util/types';
import InfoPopup from '@/components/InfoPopup';
import KFactorHelp from '@/components/KFactorHelp';
import BackupDetailsModal from '@/components/BackupDetailsModal';
import Snackbar from '@/components/Snackbar';
import Confirm from '@/components/Confirm';
import { FaCalculator, FaSave, FaUser } from 'react-icons/fa';
import PlayerInfoModal from './PlayerInfoModal';
import { usePlayerInfo } from '@/hooks/usePlayerInfo';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { FidePlayer } from '@/hooks/usePlayerInfo';
import type { BackupData } from '@/hooks/useBackup';
import { useConfirm } from '@/hooks/useConfirm';
import { useFideData } from '@/hooks/useFideData';
import LiveRatingBox from '@/components/LiveRatingBox';

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
  const {
    results,
    addResult,
    removeResult,
    updateResult,
    setAllResults,
  } = useRatingList(type);

  const {
    backups,
    createBackup,
    deleteBackup
  } = useBackup(type);

  const { isOpen: confirmOpen, title: confirmTitle, message: confirmMessage, openConfirm, handleConfirm, handleCancel } = useConfirm();

  // Set default K based on type
  const getDefaultK = (type: RatingType) => (type === 'standard' ? 40 : 20);

  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  // On first load, use localStorage rating, else last saved result, else default
  const getInitialPlayerRating = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`fide-player-rating-${type}`);
      if (stored && !isNaN(Number(stored))) return Number(stored);
    }
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
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    type: 'success'
  });
  // Removed useFideData and related code
  const inputRef = useRef<HTMLInputElement>(null);
  const [playerRatingManuallyChanged, setPlayerRatingManuallyChanged] = useState(false);
  const [playerInfoModalOpen, setPlayerInfoModalOpen] = useState(false);
  const debouncedOpponentSearch = useDebouncedValue(opponentSearch, 500);
  const { fideData, loading: fideLoading, search: fideSearch } = useFideData('');

  // Use the new player info hook
  const {
    playerName,
    setPlayerName,
    playerInfo,
    loading: playerInfoLoading,
    error: playerInfoError,
  } = usePlayerInfo('Nguyen, Anh Kiet', type);

  // Add playerInfoModal state for modal selection
  const [playerInfoModal, setPlayerInfoModal] = useState<FidePlayer | null>(null);

  // Handle save in player info modal
  const handleSavePlayerInfo = () => {
    setPlayerInfoModalOpen(false);
    setPlayerRatingManuallyChanged(false);
    // Persist modal-selected player info and rating to localStorage
    if (playerInfoModal) {
      const rating = getPlayerRatingForType(playerInfoModal, type);
      setPlayerRating(Number(rating) || 1888);
      // Save to localStorage for persistence
      try {
        localStorage.setItem(`fide-player-rating-${type}`, String(rating));
      } catch (e) {
        console.error('Error saving player info to localStorage:', e);
      }
    }
  };

  // Sync player rating with player info unless manually changed
  useEffect(() => {
    if (!playerRatingManuallyChanged) {
      // Prefer localStorage value if available
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`fide-player-rating-${type}`);
        if (stored && !isNaN(Number(stored))) {
          setPlayerRating(Number(stored));
          return;
        }
      }
      // Fallback to modal-selected player info or hook
      const info = playerInfoModal || playerInfo;
      if (info) {
        const rating = getPlayerRatingForType(info, type);
        setPlayerRating(Number(rating) || 1888);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerInfo, playerInfoModal, type]);

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
      date: new Date().toLocaleDateString()
    };
    addResult(newResult);
    // Reset form after add/update, but preserve player rating from modal or playerInfo
    setSelectedResult(null);
    const info = playerInfoModal || playerInfo;
    if (info) {
      const rating = getPlayerRatingForType(info, type);
      setPlayerRating(Number(rating) || 1888);
    } else {
      setPlayerRating(1888);
    }
    setOpponentName('');
    setOpponentRating(1400);
    setKFactor(getDefaultK(type));
    setResult('win');
    setCurrentRatingChange(null);
  };

  const handleRemove = (index: number) => {
    removeResult(index);
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

  // Backup handlers
  const handleCreateBackup = () => {
    const success = createBackup(results);
    if (success) {
      setSnackbar({
        open: true,
        message: 'Backup created successfully!',
        type: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'No data to backup. Please add some games first.',
        type: 'info'
      });
    }
  };

  const handleViewBackup = (backup: BackupData) => {
    setSelectedBackup(backup);
  };

  const handleDeleteBackup = (backupId: string) => {
    deleteBackup(backupId);
  };

  const handleReset = () => {
    // First create a backup of current data
    const backupSuccess = createBackup(results);
    // Then clear all results
    setAllResults([]);
    // Reset form state
    setSelectedResult(null);
    setCurrentRatingChange(null);
    // After reset, use modal-selected player info if available
    const info = playerInfoModal || playerInfo;
    if (info) {
      const rating = getPlayerRatingForType(info, type);
      setPlayerRating(Number(rating) || 1888);
    } else {
      setPlayerRating(1888);
    }
    // Show success message
    setSnackbar({
      open: true,
      message: backupSuccess
        ? 'Data reset successfully! A backup has been created.'
        : 'Data reset successfully!',
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

  function getResultButtonClass(option: GameResult, selected: GameResult) {
    if (option === selected) {
      if (option === 'win') return 'bg-green-600 text-white border-green-700';
      if (option === 'draw') return 'bg-gray-500 text-white border-gray-600';
      if (option === 'loss') return 'bg-red-600 text-white border-red-700';
    } else {
      if (option === 'win') return 'bg-white text-green-700 border-green-300 hover:bg-green-50';
      if (option === 'draw') return 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100';
      if (option === 'loss') return 'bg-white text-red-600 border-red-300 hover:bg-red-50';
    }
    return '';
  }

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
          <div id="fide-form-section" className="bg-white rounded-xl shadow-lg p-5 w-full h-full print:hidden">
            <h1 className="text-2xl md:text-3xl font-bold mb-5 text-center text-gray-800">
              {getTypeDisplayName(type)} Rating Calculator
            </h1>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    Player Rating
                    <button
                      type="button"
                      className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                      aria-label="View player info"
                      onClick={() => setPlayerInfoModalOpen(true)}
                    >
                      <FaUser className="inline w-5 h-5 align-text-bottom" />
                    </button>
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={playerRating}
                    onChange={handlePlayerRatingChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    K-Factor
                    <InfoPopup
                      title="Help notes"
                      content={<KFactorHelp />}
                    />
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black h-[42px]"
                    value={kFactor}
                    onChange={(e) => setKFactor(Number(e.target.value))}
                  >
                    <option value={40}>40</option>
                    <option value={20}>20</option>
                    <option value={10}>10</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Opponent Name</label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      value={opponentName}
                      onChange={handleOpponentNameChange}
                      onFocus={() => setShowOpponentDropdown(true)}
                      autoComplete="off"
                    />
                    {showOpponentDropdown && opponentSearch && (
                      <div className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                        {fideLoading ? (
                          <div className="p-3 text-gray-500 text-center">Loading...</div>
                        ) : (
                          fideData.length > 0 ? (
                            fideData.map((player) => {
                              const rating = getPlayerRatingForType(player, type);
                              return (
                                <button
                                  key={player.fideId + player.name}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-100 focus:bg-blue-200 focus:outline-none flex justify-between items-center text-black"
                                  onClick={() => handleSelectOpponent(player.name, player)}
                                  type="button"
                                >
                                  <span className="text-black">{player.name} ({player.federation})</span>
                                  <span className="text-gray-500 ml-2">{rating || '—'}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-gray-500 text-center">No players found</div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Opponent Rating</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={opponentRating}
                    onChange={(e) => setOpponentRating(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-0 hidden md:block">Result</label>
                <div className="flex w-full gap-x-2">
                  {(['win', 'draw', 'loss'] as GameResult[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`flex-1 px-2 py-2 rounded-lg font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getResultButtonClass(option, result)}`}
                      onClick={() => handleResultChange(option)}
                      aria-pressed={result === option}
                    >
                      {option.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                >
                  <FaCalculator /> Calculate
                </button>
                <button
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleTrack}
                  disabled={!isFormValid}
                >
                  <FaSave /> Save
                </button>
              </div>
              {(!isValidRating(playerRating) || !isValidRating(opponentRating)) && (
                <div className="text-red-600 text-sm mt-2">Player and Opponent ratings must be between 1400 and 3500.</div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3 p-1 print:hidden">
          {currentRatingChange !== null ? (
            <CurrentChangeBox currentRatingChange={currentRatingChange} />
          ) : (
            <LiveRatingBox currentRatingChange={totalChange} currentRating={playerRating} />
          )
          }
        </div>
      </div>
      <ListRatingChange
        results={results}
        onRemove={handleRemove}
        onSelect={handleSelectResult}
        onUpdateDate={handleUpdateDate}
        onReorder={handleReorder}
        backups={backups}
        onViewBackup={handleViewBackup}
        onCreateBackup={handleCreateBackup}
        onReset={handleResetClick}
      />

      {/* Backup Details Modal */}
      <BackupDetailsModal
        backup={selectedBackup}
        onClose={() => setSelectedBackup(null)}
        onDelete={handleDeleteBackup}
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

      {/* Player Info Modal */}
      <PlayerInfoModal
        open={playerInfoModalOpen}
        onClose={() => setPlayerInfoModalOpen(false)}
        playerName={playerName}
        setPlayerName={setPlayerName}
        playerInfo={playerInfoModal}
        setPlayerInfo={setPlayerInfoModal}
        loading={playerInfoLoading}
        error={playerInfoError}
        onSave={handleSavePlayerInfo}
        forceRefetchOnOpen={false}
      />
    </div>
  );
}