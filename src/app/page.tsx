'use client';

import { useState, useEffect } from 'react';
import { calculateRatingChange } from '../util/util';
import ListRatingChange from '@/components/ListRatingChange';
import CurrentChangeBox from '@/components/CurrentChangeBox';
import styles from './page.module.css';
import type { GameResult, Result } from '@/util/types';

export default function Home() {
  const [playerRating, setPlayerRating] = useState<number>(1881);
  const [kFactor, setKFactor] = useState<number>(40);
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentRating, setOpponentRating] = useState<number>(1400);
  const [result, setResult] = useState<GameResult>('win');
  const [results, setResults] = useState<Result[]>([]);
  const [totalChange, setTotalChange] = useState<number>(0);
  const [currentRatingChange, setCurrentRatingChange] = useState<number | null>(null);

  useEffect(() => {
    const savedPlayerRating = localStorage.getItem('fidePlayerRating');
    if (savedPlayerRating) {
      setPlayerRating(Number(savedPlayerRating));
    }
    const savedResults = localStorage.getItem('fideResults');
    if (savedResults) {
      const parsedResults = JSON.parse(savedResults);
      setResults(parsedResults);
      const total = Math.round(100 * parsedResults.reduce((acc: number, curr: Result) => acc + curr.ratingChange, 0)) / 100;
      setTotalChange(total);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fidePlayerRating', String(playerRating));
  }, [playerRating]);

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
      playerRating,
      opponentName,
      opponentRating,
      kFactor,
      result,
      ratingChange,
      date: new Date().toLocaleDateString()
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setTotalChange(totalChange + ratingChange);
    localStorage.setItem('fideResults', JSON.stringify(updatedResults));
  };

  const handleRemove = (index: number) => {
    const updatedResults = results.filter((_, i) => i !== index);
    setResults(updatedResults);
    setTotalChange(updatedResults.reduce((acc, curr) => acc + curr.ratingChange, 0));
    localStorage.setItem('fideResults', JSON.stringify(updatedResults));
  };

  return (
    <div className="min-h-screen p-1 md:p-5 bg-gray-50 max-w-7xl mx-auto">

      {/* Print CSS moved to CSS module */}
      <div className={styles.printTotalChange + " w-full items-center justify-center"}>
        <div className={styles.printTotalChangeCircle}>
          <span className={`text-[8vw] font-bold ${totalChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{totalChange > 0 ? '+' : ''}{totalChange}</span>
        </div>
      </div>
      {/* Form and current change box on top */}

      <div className='flex flex-col md:flex-row w-full max-w-7xl gap-3'>
        <div className="w-full md:w-2/3 p-1">
          <div id="fide-form-section" className="bg-white rounded-xl shadow-lg p-5 w-full h-full print:hidden">
            <h1 className="text-3xl font-bold mb-5 text-center text-gray-800">FIDE Rating Calculator</h1>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Player Rating</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={playerRating}
                    onChange={(e) => setPlayerRating(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">K Factor</label>
                  <select
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={kFactor}
                    onChange={(e) => setKFactor(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={40}>40</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Opponent Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                  />
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
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-3">Result</label>
                <div className="flex space-x-6">
                  {['win', 'draw', 'loss'].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        checked={result === option}
                        onChange={() => setResult(option as GameResult)}
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCalculate}
                  disabled={!isFormValid}
                >
                  Calculate
                </button>
                <button
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleTrack}
                  disabled={!isFormValid}
                >
                  Save
                </button>
              </div>
              {(!isValidRating(playerRating) || !isValidRating(opponentRating)) && (
                <div className="text-red-600 text-sm mt-2">Player and Opponent ratings must be between 1400 and 3500.</div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3 p-1 print:hidden">
          {currentRatingChange !== null && (
            <CurrentChangeBox currentRatingChange={currentRatingChange} />
          )}
        </div>
      </div>
      <ListRatingChange
        results={results}
        onRemove={handleRemove}
        onSelect={(result, _) => {
          setPlayerRating(result.playerRating);
          setOpponentName(result.opponentName);
          setOpponentRating(result.opponentRating);
          setKFactor(result.kFactor);
          setResult(result.result);
          setCurrentRatingChange(result.ratingChange);
          // Optionally scroll to form
          const formSection = document.getElementById('fide-form-section');
          if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}
