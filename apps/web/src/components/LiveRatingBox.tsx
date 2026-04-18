import React from 'react';

interface LiveRatingBoxProps {
  currentRatingChange: number;
  currentRating: number;
}

export default function LiveRatingBox({ currentRatingChange, currentRating }: LiveRatingBoxProps) {
  const liveRating = Math.round(currentRating + currentRatingChange);
  const changeColorClass =
    currentRatingChange > 0
      ? 'text-green-600'
      : currentRatingChange < 0
        ? 'text-red-600'
        : 'text-blue-600';

  const formattedChange =
    currentRatingChange > 0
      ? `+${currentRatingChange}`
      : currentRatingChange < 0
        ? `${currentRatingChange}`
        : '+0';

  return (
    <div className="bg-white rounded-3xl shadow-md relative overflow-hidden h-auto md:h-full flex items-stretch w-full">
      <div className="absolute inset-y-3 left-0 w-1.5 rounded-r-full bg-blue-500" />
      <div className="flex-1 px-6 py-5 flex flex-col justify-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-gray-500 uppercase mb-2">
          Live rating
        </p>
        <p className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-1">{liveRating}</p>
        <p className={`text-sm font-semibold ${changeColorClass}`}>{formattedChange}</p>
      </div>
    </div>
  );
}
