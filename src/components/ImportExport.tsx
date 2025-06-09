import { useRef } from 'react';
import { Result } from '@/util/types';
import { FaFileImport, FaFileExport } from 'react-icons/fa';

interface ImportExportProps {
    results: Result[];
    onImport: (imported: Result[]) => void;
}

export default function ImportExport({ results, onImport }: ImportExportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export to CSV
    const handleExport = () => {
        const headers = ['Date', 'Player Rating', 'Opponent Name', 'Opponent Rating', 'K Factor', 'Result', 'Rating Change'];
        const rows = results.map(r => [
            r.date,
            r.playerRating,
            // Escape double quotes and wrap in quotes, but do not double-quote commas (CSV standard: quoted fields can contain commas)
            r.opponentName.replace(/"/g, '""'),
            r.opponentRating,
            r.kFactor,
            r.result,
            r.ratingChange
        ]);
        // Use semicolon as separator, wrap all fields in double quotes
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${String(field)}"`).join(';'))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rating-changes.csv';
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
            const lines = text.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) return;
            const imported: Result[] = [];
            for (let i = 1; i < lines.length; i++) {
                // Split by semicolon, handle quoted fields
                const cols: string[] = [];
                let current = '';
                let inQuotes = false;
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    if (char === '"') {
                        if (inQuotes && lines[i][j + 1] === '"') {
                            current += '"';
                            j++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ';' && !inQuotes) {
                        cols.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                cols.push(current);
                if (cols.length < 7) continue;
                const [date, playerRating, opponentName, opponentRating, kFactor, result, ratingChange] = cols.map(col => col.replace(/^"|"$/g, '').replace(/""/g, '"'));
                // Skip if already exists (opponent name and rating match)
                if (results.some(r => r.opponentName === opponentName && String(r.opponentRating) === opponentRating)) continue;
                imported.push({
                    date,
                    playerRating: Number(playerRating),
                    opponentName,
                    opponentRating: Number(opponentRating),
                    kFactor: Number(kFactor),
                    result: result as Result['result'],
                    ratingChange: Number(ratingChange)
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
        <div className="flex items-center gap-2 mt-4 print:hidden">
            <button onClick={handleExport} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-2">
                <FaFileExport /> Export CSV
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-2">
                <FaFileImport /> Import CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
    );
}
