import React, { useState } from 'react';
import { BackupData } from '@/hooks/useBackup';
import { FaTimes, FaTrash } from 'react-icons/fa';
import PieChart from './PieChart';
import Confirm from './Confirm';

interface BackupDetailsModalProps {
  backup: BackupData | null;
  onClose: () => void;
  onDelete: (backupId: string) => void;
}

export default function BackupDetailsModal({ 
  backup, 
  onClose, 
  onDelete 
}: BackupDetailsModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!backup) return null;

  const handleDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(backup.id);
    onClose();
    setConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <Confirm
          open={confirmOpen}
          title="Delete Backup"
          message={`Are you sure you want to delete the backup for ${backup.month}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Your performance of {backup.month}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete this backup"
            >
              <FaTrash />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Games Played:</span>
                  <span className="font-medium text-gray-900">{backup.gameCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Rating Change:</span>
                  <span className={`font-medium ${backup.totalChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {backup.totalChange >= 0 ? '+' : ''}{backup.totalChange}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Backup Created:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(backup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-center">
                <PieChart
                  wins={backup.data.filter(r => r.result === 'win').length}
                  draws={backup.data.filter(r => r.result === 'draw').length}
                  losses={backup.data.filter(r => r.result === 'loss').length}
                  size={100}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-center">
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                    backup.totalChange >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {backup.totalChange >= 0 ? '+' : ''}{backup.totalChange}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Game Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 text-gray-800 font-medium">Date</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Opponent</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Opponent Rating</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Your Rating</th>
                    <th className="text-left p-2 text-gray-800 font-medium">K-Factor</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Result</th>
                    <th className="text-left p-2 text-gray-800 font-medium">Rating Change</th>
                  </tr>
                </thead>
                <tbody>
                  {backup.data.map((game, index) => (
                    <tr key={game.id || index} className="border-b border-gray-200">
                      <td className="p-2 text-gray-900">{game.date}</td>
                      <td className="p-2 text-gray-900">{game.opponentName}</td>
                      <td className="p-2 text-gray-900">{game.opponentRating}</td>
                      <td className="p-2 text-gray-900">{game.playerRating}</td>
                      <td className="p-2 text-gray-900">{game.kFactor}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          game.result === 'win' ? 'bg-green-100 text-green-800' :
                          game.result === 'draw' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {game.result.toUpperCase()}
                        </span>
                      </td>
                      <td className={`p-2 font-medium ${game.ratingChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {game.ratingChange >= 0 ? '+' : ''}{game.ratingChange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 