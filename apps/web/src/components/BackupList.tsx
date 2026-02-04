import React from 'react';
import { BackupData } from '@/hooks/useBackup';
import { FaEye } from 'react-icons/fa';

interface BackupListProps {
  backups: BackupData[];
  onView: (backup: BackupData) => void;
}

export default function BackupList({ backups, onView }: BackupListProps) {
  if (backups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 print:hidden">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Backups</h2>
        <div className="text-center py-8 text-gray-500">
          <FaEye className="mx-auto text-4xl mb-3 text-gray-300" />
          <p>No backups available</p>
          <p className="text-sm">Create a backup to save your monthly data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 print:hidden">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Backups</h2>
      <div className="space-y-3">
        {backups.map((backup) => (
          <div
            key={backup.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-800">{backup.month}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(backup.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Games:</span>
                    {backup.gameCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Total Change:</span>
                    <span className={backup.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {backup.totalChange >= 0 ? '+' : ''}{backup.totalChange}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(backup)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="View backup details"
                >
                  <FaEye />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 