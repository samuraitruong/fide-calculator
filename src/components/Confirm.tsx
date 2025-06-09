import React from 'react';

interface ConfirmProps {
    open: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function Confirm({
    open,
    title = 'Confirm',
    message = 'Are you sure?',
    confirmText = 'Yes',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
}: ConfirmProps) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xs mx-2 animate-fade-in">
                <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
                <p className="text-gray-700 mb-4 text-center">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
