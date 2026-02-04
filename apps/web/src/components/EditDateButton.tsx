import { useState } from 'react';

interface EditDateButtonProps {
    date: string;
    onChange: (date: string) => void;
}

export default function EditDateButton({ date, onChange }: EditDateButtonProps) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(dateToInputValue(date));

    function dateToInputValue(dateStr: string) {
        // Check for DD/MM/YYYY format
        const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateStr.match(ddmmyyyy);

        if (match) {
            const [, day, month, year] = match;
            const d = new Date(`${year}-${month}-${day}`);
            if (!isNaN(d.getTime())) {
                return d.toISOString().slice(0, 10); // returns YYYY-MM-DD
            }
        }

        // Fallback for ISO or parseable formats like YYYY-MM-DD
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
        }

        return '';
    }

    function handleSave() {
        setEditing(false);
        if (value) {
            onChange(value);
        }
    }

    return editing ? (
        <span className="flex items-center gap-1 w-full min-w-[140px]" onClick={e => e.stopPropagation()}>
            <input
                type="date"
                className="border rounded px-1 text-xs flex-1"
                value={value}
                onChange={e => setValue(e.target.value)}
                style={{ minWidth: 0 }}
            />
            <button className="text-blue-600 text-xs px-1" onClick={handleSave}>✔</button>
            <button className="text-gray-400 text-xs px-1" onClick={() => setEditing(false)}>✕</button>
        </span>
    ) : (
        <button
            className="ml-1 text-xs text-blue-500 underline hover:text-blue-700 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 print:hidden"
            title="Edit date"
            onClick={e => { e.stopPropagation(); setEditing(true); }}
            tabIndex={-1}
        >
            Edit
        </button>
    );
}
