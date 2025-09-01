'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isValid = newPassword.length >= 6 && confirmPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!isValid) {
      setError('Please ensure passwords match and meet minimum length.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) {
      setError(error.message || 'Failed to update password');
    } else {
      setMessage('Password updated successfully. Redirecting to sign in...');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/'), 1200);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-4">Enter a new password for your account.</p>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {message && <div className="text-sm text-green-600 mb-2">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-gray-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-gray-900"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <div className="text-xs text-red-600 mt-1">Passwords do not match.</div>
            )}
          </div>
          <button type="submit" disabled={loading || !isValid} className="w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}


