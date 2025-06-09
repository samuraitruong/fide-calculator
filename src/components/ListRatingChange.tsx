import Confirm from '@/components/Confirm';
import ImportExport from '@/components/ImportExport';
import { Result } from '@/util/types';
import { roundNumber } from '@/util/util';
import { useState } from 'react';
import EditDateButton from './EditDateButton';
import { FaArrowUp, FaArrowDown, FaMinus, FaTrashAlt } from 'react-icons/fa';

interface ListRatingChangeProps {
  results: Result[];
  onRemove: (index: number) => void;
  onSelect?: (result: Result, index: number) => void;
  onUpdateDate?: (index: number, date: string) => void;
}

export default function ListRatingChange({ results, onRemove, onSelect, onUpdateDate }: ListRatingChangeProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const totalChange = roundNumber(results.reduce((acc, curr) => acc + curr.ratingChange, 0));

  const handleRemoveClick = (index: number) => {
    setPendingRemove(index);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (pendingRemove !== null) {
      onRemove(pendingRemove);
    }
    setConfirmOpen(false);
    setPendingRemove(null);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingRemove(null);
  };

  // Handle import callback
  const handleImport = (imported: Result[]) => {
    const merged = [...results, ...imported];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('importedResults', { detail: merged }));
    }
  };

  return (
    <div className="w-full mt-5 md:mt-8 bg-white rounded-xl shadow-lg p-3 md:p-8 print:p-0 print:shadow-none print:border-0 print:rounded-none">
      <Confirm
        open={confirmOpen}
        title="Remove Rating Change"
        message="Are you sure you want to remove this rating change?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Rating changes</h2>
        <div className="flex items-center gap-2 print:hidden">
          <span className="text-lg font-medium text-gray-700">Total Change:</span>
          <span className="text-3xl font-bold flex items-center gap-2">
            {totalChange > 0 && <FaArrowUp className="text-green-600" />}
            {totalChange < 0 && <FaArrowDown className="text-red-600" />}
            {totalChange === 0 && <FaMinus className="text-gray-400" />}
            <span className={totalChange > 0 ? 'text-green-600' : totalChange < 0 ? 'text-red-600' : 'text-gray-600'}>
              {Math.abs(totalChange)}
            </span>
          </span>
        </div>
      </div>
      {/* Desktop/Tablet View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Player Rating</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Opponent</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Opponent Rating</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">K-Factor</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Result</th>
              <th className="border border-gray-200 p-3 text-left text-sm font-medium text-gray-700">Rating Change</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect && onSelect(result, index)}
              >
                <td className="border border-gray-200 p-3 text-sm text-gray-700 flex items-center gap-2 group">
                  <span>{result.date}</span>
                  {onUpdateDate && (
                    <span style={{ zIndex: 10, position: 'relative' }}>
                      <EditDateButton
                        date={result.date}
                        onChange={(date: string) => onUpdateDate(index, date)}
                      />
                    </span>
                  )}
                </td>
                <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.playerRating}</td>
                <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.opponentName}</td>
                <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.opponentRating}</td>
                <td className="border border-gray-200 p-3 text-sm text-gray-700">{result.kFactor}</td>
                <td className="border border-gray-200 p-3 text-sm text-gray-700 capitalize">{result.result}</td>
                <td className="border border-gray-200 p-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {result.ratingChange > 0 && <FaArrowUp className="text-green-600" />}
                      {result.ratingChange < 0 && <FaArrowDown className="text-red-600" />}
                      {result.ratingChange === 0 && <FaMinus className="text-gray-400" />}
                      <span className={result.ratingChange > 0 ? 'text-green-600' : result.ratingChange < 0 ? 'text-red-600' : 'text-gray-600'}>
                        {Math.abs(result.ratingChange)}
                      </span>
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemoveClick(index); }}
                      className="text-red-600 hover:text-red-800 ml-4 print:hidden"
                      title="Delete entry"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className="bg-gray-50 p-4 rounded-lg space-y-2 text-black cursor-pointer"
            onClick={() => onSelect && onSelect(result, index)}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center gap-2 group">
                {result.date}
                {onUpdateDate && (
                  <span style={{ zIndex: 10, position: 'relative' }}>
                    <EditDateButton
                      date={result.date}
                      onChange={(date: string) => onUpdateDate(index, date)}
                    />
                  </span>
                )}
              </span>
              <button
                onClick={e => { e.stopPropagation(); handleRemoveClick(index); }}
                className="text-red-600 hover:text-red-800"
                title="Delete entry"
              >
                <FaTrashAlt />
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">YOU vs. {result.opponentName}</span>
              <span className="text-sm capitalize">{result.result}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {result.playerRating} vs {result.opponentRating}
              </span>
              <span className={`text-lg font-medium ${result.ratingChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.ratingChange > 0 ? '+' : ''}{result.ratingChange}
              </span>
            </div>
          </div>
        ))}
      </div>
      <ImportExport results={results} onImport={handleImport} />
    </div>
  );
}


