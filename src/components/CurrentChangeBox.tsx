import React from 'react';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';

interface CurrentChangeBoxProps {
    currentRatingChange: number;
}

export default function CurrentChangeBox({ currentRatingChange }: CurrentChangeBoxProps) {
    return (
        <div className="bg-white rounded-xl shadow-lg current-change-box h-auto md:h-full flex flex-col items-center justify-start md:justify-center md:items-center w-full">
            <h2 className="text-3xl font-bold text-gray-700 mb-2 text-center">Rating change</h2>
            <div className="flex flex-col items-center justify-center">
                <span className="text-[8rem] font-bold flex items-center gap-4">
                    {currentRatingChange > 0 && <FaArrowUp data-testid="FaArrowUp" className="text-green-600 text-6xl md:text-7xl" />}
                    {currentRatingChange < 0 && <FaArrowDown data-testid="FaArrowDown" className="text-red-600 text-6xl md:text-7xl" />}
                    {currentRatingChange === 0 && <FaMinus data-testid="FaMinus" className="text-gray-400 text-6xl md:text-7xl" />}
                    <span className={currentRatingChange > 0 ? 'text-green-600' : currentRatingChange < 0 ? 'text-red-600' : 'text-gray-600'}>
                        {Math.abs(currentRatingChange)}
                    </span>
                </span>
            </div>
        </div>
    );
}
