'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to send reset email');
    } else {
      setSuccess('Reset email sent. Please check your inbox.');
      // Removed auto-close to avoid unexpected closing while typing
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1D302A]/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md border border-[#D4DDD6] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D4DDD6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#146B52] text-xl">♟</span>
            <h3 className="text-lg font-bold text-[#1D302A]">Forgot Password</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#52645B] hover:text-[#1D302A] p-1 text-lg font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-[#52645B]">
            Enter your registered email address and we&apos;ll send you a password reset link.
          </p>
          {error && (
            <div className="text-sm text-[#AE3535] bg-[#FCEAEA] px-3.5 py-2.5 rounded-[14px] font-medium border border-[#FCEAEA]">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-[#176447] bg-[#E1F3E8] px-3.5 py-2.5 rounded-[14px] font-medium border border-[#E1F3E8]">
              {success}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#52645B] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              className="w-full border-1.5 border-[#7A8E81] rounded-[14px] px-3.5 py-2.5 text-[#1D302A] placeholder-[#7A8E81] focus:outline-none focus:ring-2 focus:ring-[#146B52] focus:border-[#146B52]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-[#52645B] hover:text-[#1D302A] rounded-[14px] border border-[#D4DDD6] hover:bg-[#F7F8F2] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold rounded-[14px] bg-[#146B52] text-white hover:bg-[#0E5440] disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


