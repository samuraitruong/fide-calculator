import React from 'react';

interface CurrentChangeBoxProps {
    currentRatingChange: number;
}

export default function CurrentChangeBox({ currentRatingChange }: CurrentChangeBoxProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg current-change-box h-auto md:h-full flex flex-col items-center justify-start md:justify-center md:items-center w-full">
            <h2 className="text-3xl font-bold text-gray-700 mb-2 text-center">Current Change</h2>
            <div className={`text-[8rem] font-bold ${currentRatingChange > 0 ? 'text-green-600' : 'text-red-600'} text-center`}>
                {currentRatingChange > 0 ? '+' : ''}{currentRatingChange}
            </div>
        </div>
    );
}
