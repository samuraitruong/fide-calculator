import { useRef } from 'react';
import { Result } from '@/util/types';
import { FaFileImport, FaFileExport, FaDownload, FaUndo } from 'react-icons/fa';

interface ImportExportProps {
  results: Result[];
  onImport: (imported: Result[]) => void;
 onViewDetails?: () => void;
 onReset?: () => void;
 ratingType?: 'standard' | 'blitz' | 'rapid';
}

export default function ImportExport({ results, onImport, onViewDetails, onReset, ratingType }: ImportExportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export to CSV
    const handleExport = () => {
        if (!results || results.length === 0) return;
        const csvRows = [
            'Date,Player Rating,Opponent Name,Opponent Rating,K-Factor,Result,Rating Change',
            ...results.map(r => [
                r.date,
                r.playerRating,
                r.opponentName,
                r.opponentRating,
                r.kFactor,
                r.result,
                r.ratingChange
            ].join(';'))
        ];
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fide-rating-changes.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import from CSV
    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(Boolean);
            if (lines.length < 2) return;
            const imported: Result[] = [];
            for (let i = 1; i < lines.length; i++) {
                const [date, playerRating, opponentName, opponentRating, kFactor, result, ratingChange] = lines[i].split(';');
                if (!date) continue;
                
                // Parse the date to get month key
                const dateObj = new Date(date);
                const monthKey = `${dateObj.getFullYear()}-${dateObj.toLocaleDateString('en-US', { month: 'short' })}`;
                
                imported.push({
                    id: Date.now().toString() + Math.random().toString().slice(2), // Generate unique ID
                    date,
                    playerRating: Number(playerRating),
                    opponentName,
                    opponentRating: Number(opponentRating),
                    kFactor: Number(kFactor),
                    result: result as Result['result'],
                    ratingChange: Number(ratingChange),
                    ratingType: ratingType || 'standard', // Use provided rating type or default to standard
                    monthKey
                });
            }
            if (imported.length > 0) {
                onImport(imported);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex justify-between items-center gap-x-2 mt-4 print:hidden">
            <button onClick={handleExport} className="flex-1 flex flex-col items-center justify-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm gap-y-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!results || results.length === 0}>
                <FaFileExport className="text-2xl md:text-lg" />
                <span className="hidden md:inline">Export CSV</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm gap-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
                <FaFileImport className="text-2xl md:text-lg" />
                <span className="hidden md:inline">Import CSV</span>
            </button>
            <button 
                onClick={onViewDetails} 
                className="flex-1 flex flex-col items-center justify-center px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm gap-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!results || results.length === 0}
            >
                <FaDownload className="text-2xl md:text-lg" />
                <span className="hidden md:inline">View Details</span>
            </button>
            <button 
                onClick={onReset} 
                className="flex-1 flex flex-col items-center justify-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm gap-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!results || results.length === 0}
            >
                <FaUndo className="text-2xl md:text-lg" />
                <span className="hidden md:inline">Reset</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
    );
}
