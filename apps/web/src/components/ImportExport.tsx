import { exportRatingCsv, importRatingCsv } from './ratingMonthCsv';
import { useState, useRef } from 'react';
import { Result } from '@/util/types';
import { FaFileImport, FaFileExport, FaDownload, FaUndo } from 'react-icons/fa';

interface ImportExportProps {
  results: Result[];
  onImport: (imported: Result[]) => void | Promise<void>;
 onViewDetails?: () => void;
 onReset?: () => void;
 ratingType?: 'standard' | 'blitz' | 'rapid';
}

export default function ImportExport({ results, onImport, onViewDetails, onReset, ratingType }: ImportExportProps) {
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export to CSV
    const handleExport = () => {
        if (!results || results.length === 0) return;
        const csvContent = exportRatingCsv(results);
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
        reader.onload = async (event) => {
            try {
                setError('');
                const imported = importRatingCsv(String(event.target?.result || ''), ratingType || 'standard');
                if (imported.length > 0) await onImport(imported);
            } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to import games.'); }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
        {error && <p role="alert" className="text-red-700">{error}</p>}
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
        </>
    );
}
