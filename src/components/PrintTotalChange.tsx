import React from 'react';

interface PrintTotalChangeProps {
    totalChange: number;
}

export default function PrintTotalChange({ totalChange }: PrintTotalChangeProps) {
    return (
        <div className="hidden print:flex w-full items-center justify-center mb-5 mt-5">
            <div className="flex justify-center items-center w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] max-w-[600px] max-h-[600px] rounded-full border-8 border-gray-200 bg-white shadow-lg">
                <span className={`text-[8vw] font-bold ${totalChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{totalChange > 0 ? '+' : ''}{totalChange}</span>
            </div>
        </div>
    );
}
