'use client';

import { useState, useEffect } from 'react';
import { calculateRatingChange } from '../util/util';
import ListRatingChange from '@/components/ListRatingChange';

type GameResult = 'win' | 'draw' | 'loss';

interface Result {
  playerRating: number;
  opponentName: string;
  opponentRating: number;
  kFactor: number;
  result: GameResult;
  ratingChange: number;
  date: string;
}



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

  const handleCalculate = () => {
    const ratingChange = calculateRatingChange(playerRating, opponentRating, result, kFactor);
    setCurrentRatingChange(ratingChange);
  };

  const handleTrack = () => {
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
    <div className="min-h-screen p-1 md:p-5 bg-gray-50">
      {/* Print CSS */}
      <style>{`
        @media print {
          #fide-form-section, .current-change-box, .no-print { display: none !important; }
          .print-total-change {
            display: flex !important;
            justify-content: center;
            align-items: flex-start;
            width: 100vw;
            height: auto;
            position: static;
            top: 0;
            left: 0;
            z-index: 9999;
            background: white !important;
            margin-bottom: 2rem;
            page-break-after: avoid;
          }
          .print-total-change-circle {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 30vw;
            height: 30vw;
            min-width: 300px;
            min-height: 300px;
            max-width: 600px;
            max-height: 600px;
            border-radius: 50%;
            border: 8px solid #e5e7eb;
            background: #fff;
            box-shadow: 0 0 40px rgba(0,0,0,0.08);
            margin: 0 auto 2rem auto;
          }
          .print-table {
            margin-top: 0 !important;
          }
          body, html {
            background: white !important;
          }
        }
        .print-total-change {
          display: none;
        }
      `}</style>
      {/* Print Total Change (hidden on screen, big on print, centered in a circle) */}
      <div className="print-total-change w-full items-center justify-center">
        <div className="print-total-change-circle">
          <span className={`text-[8vw] font-bold ${totalChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{totalChange > 0 ? '+' : ''}{totalChange}</span>
        </div>
      </div>
      {/* Form and current change box on top */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 no-print mb-12">
        <div id="fide-form-section" className="bg-white rounded-xl shadow-lg p-5">
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
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleCalculate}
              >
                Calculate
              </button>
              <button
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={handleTrack}
              >
                Track
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {currentRatingChange !== null && (
            <div className="bg-white rounded-xl shadow-lg p-8 h-fit current-change-box">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Current Change</h2>
              <div className={`text-[8rem] font-bold ${currentRatingChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{currentRatingChange > 0 ? '+' : ''}{currentRatingChange}</div>
            </div>
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
