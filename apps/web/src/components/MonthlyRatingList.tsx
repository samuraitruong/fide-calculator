'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import type { MonthlyData, Result, RatingType } from '@/util/types';
import ListRatingChange from './ListRatingChange';

interface MonthlyRatingListProps {
  monthlyData: MonthlyData[];
  onRemove: (index: number) => void;
  onSelect: (result: Result) => void;
  onUpdateDate: (index: number, date: string) => void;
  onReorder: (newResults: Result[]) => void;
  onReset: () => void;
  onViewDetails?: () => void;
  type: RatingType;
}

export default function MonthlyRatingList({
  monthlyData,
  onRemove,
  onSelect,
  onUpdateDate,
  onReorder,
  onReset,
  onViewDetails,
  type,
}: MonthlyRatingListProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => {
    // Initialize with current month expanded by default
    const currentMonth = monthlyData.find(month => month.isCurrentMonth);
    return currentMonth ? new Set([currentMonth.monthKey]) : new Set();
  });

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const getTypeDisplayName = (type: RatingType) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'blitz': return 'Blitz';
      case 'rapid': return 'Rapid';
      default: return type;
    }
  };

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-4">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No {getTypeDisplayName(type).toLowerCase()} games recorded yet</p>
          <p className="text-sm">Start by adding your first game above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {monthlyData.map((monthData) => (
        <div key={monthData.monthKey} className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Month Header */}
          <div 
            className={`p-4 cursor-pointer transition-colors ${
              monthData.isCurrentMonth 
                ? 'bg-blue-50 border-l-4 border-blue-500' 
                : 'bg-gray-50 border-l-4 border-gray-300'
            }`}
            onClick={() => toggleMonth(monthData.monthKey)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {monthData.month}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {monthData.gameCount} game{monthData.gameCount !== 1 ? 's' : ''}
                  </span>
                  <span className={`text-sm font-medium ${
                    monthData.totalChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {monthData.totalChange >= 0 ? '+' : ''}{monthData.totalChange}
                  </span>
                </div>
                {monthData.isReadOnly && (
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    Read Only
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {expandedMonths.has(monthData.monthKey) ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </div>
            </div>
          </div>

          {/* Month Content */}
          {expandedMonths.has(monthData.monthKey) && (
            <div className="p-4 border-t border-gray-100">
              <ListRatingChange
                results={monthData.results}
                onRemove={monthData.isReadOnly ? undefined : onRemove}
                onSelect={onSelect}
                onUpdateDate={monthData.isReadOnly ? undefined : onUpdateDate}
                onReorder={monthData.isReadOnly ? undefined : onReorder}
                onViewDetails={onViewDetails}
                onReset={monthData.isReadOnly ? undefined : onReset}
                readOnly={monthData.isReadOnly}
                ratingType={type}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
