'use client';

import { useState, useEffect } from 'react';

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

function calculateRatingChange(playerRating: number, opponentRating: number, result: GameResult, kFactor: number) { 
  let S; 
  if (result === 'win') S = 1; 
  else if (result === 'draw') S = 0.5; 
  else if (result === 'loss') S = 0; 
  else throw new Error('Invalid result. Use "win", "draw", or "loss".'); 

  const E = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400)); 
  const delta = kFactor * (S - E); 
  return Math.round(delta *100)/100; 
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
    const savedResults = localStorage.getItem('fideResults');
    if (savedResults) {
      const parsedResults = JSON.parse(savedResults);
      setResults(parsedResults);
      const total = parsedResults.reduce((acc: number, curr: Result) => acc + curr.ratingChange, 0);
      setTotalChange(total);
    }
  }, []);

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
    const newTotal = updatedResults.reduce((acc, curr) => acc + curr.ratingChange, 0);
    setTotalChange(newTotal);
    localStorage.setItem('fideResults', JSON.stringify(updatedResults));
  };

  const handleHistoryClick = (result: Result) => {
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
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
        <div id="fide-form-section" className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">FIDE Rating Calculator</h1>
          
          <div className="space-y-6">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opponent Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Opponent Rating</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  value={opponentRating}
                  onChange={(e) => setOpponentRating(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
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
            <div className="bg-white rounded-xl shadow-lg p-8 h-fit">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Current Change</h2>
              <div className={`text-[8rem] font-bold ${currentRatingChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentRatingChange > 0 ? '+' : ''}{currentRatingChange}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-8 h-fit">
            <h2 className="text-lg font-medium text-gray-700 mb-2">Total Change</h2>
            <div className={`text-6xl font-bold ${totalChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChange > 0 ? '+' : ''}{totalChange}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">History</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Player Rating</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Opponent</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Opponent Rating</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">K Factor</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Result</th>
                <th className="border p-3 text-left text-sm font-medium text-gray-700">Rating Change</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleHistoryClick(result)}>
                  <td className="border p-3 text-sm text-gray-700">{result.date}</td>
                  <td className="border p-3 text-sm text-gray-700">{result.playerRating}</td>
                  <td className="border p-3 text-sm text-gray-700">{result.opponentName}</td>
                  <td className="border p-3 text-sm text-gray-700">{result.opponentRating}</td>
                  <td className="border p-3 text-sm text-gray-700">{result.kFactor}</td>
                  <td className="border p-3 text-sm text-gray-700 capitalize">{result.result}</td>
                  <td className="border p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className={result.ratingChange > 0 ? 'text-green-600' : 'text-red-600'}>
                        {result.ratingChange > 0 ? '+' : ''}{result.ratingChange}
                      </span>
                      <button
                        onClick={() => handleRemove(index)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
