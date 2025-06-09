import { useState } from 'react';
import { FaRegCircleQuestion } from 'react-icons/fa6';

interface InfoPopupProps {
    title?: string;
    content: React.ReactNode;
}

export default function InfoPopup({ title, content }: InfoPopupProps) {
    const [open, setOpen] = useState(false);
    console.log('InfoPopup rendered with title:', open);
    return (
        <span className="relative inline-block align-middle">
            <button
                type="button"
                className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                aria-label="Show info"
                onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
            >
                <FaRegCircleQuestion className="inline w-4 h-4 align-text-bottom" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); }} />
                    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                            <button
                                type="button"
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}
                                aria-label="Close info"
                            >
                                ×
                            </button>
                            {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
                            <div className="text-gray-700 text-sm space-y-2">{content}</div>
                        </div>
                    </div>
                </>
            )}
        </span>
    );
}
