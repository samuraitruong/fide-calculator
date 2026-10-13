'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaTimes, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp && password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const { error: authError } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        if (isSignUp) {
          setIsSuccess(true);
        } else {
          onSuccess();
          onClose();
        }
        // Reset form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#1D302A]/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 border border-[#D4DDD6] overflow-hidden">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#D4DDD6]">
          <div className="flex items-center gap-2">
            <span className="text-[#146B52] text-xl">♟</span>
            <h2 className="text-xl font-bold text-[#1D302A]">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#52645B] hover:text-[#1D302A] transition-colors p-1"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
            <p className="text-gray-600 mb-8">
              We&apos;ve sent a confirmation link to <span className="font-semibold text-gray-900">{email}</span>. 
              Please verify your email to complete your registration.
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setIsSignUp(false);
              }}
              className="w-full bg-[#146B52] text-white py-3 px-4 rounded-[14px] hover:bg-[#0E5440] transition-colors font-bold shadow-sm"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#52645B] mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-1.5 border-[#7A8E81] rounded-[14px] focus:ring-2 focus:ring-[#146B52] focus:border-[#146B52] text-[#1D302A] placeholder-[#7A8E81] focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#52645B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 border-1.5 border-[#7A8E81] rounded-[14px] focus:ring-2 focus:ring-[#146B52] focus:border-[#146B52] text-[#1D302A] placeholder-[#7A8E81] focus:outline-none"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#7A8E81] hover:text-[#1D302A]"
                  >
                    {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#52645B] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 pr-10 border-1.5 border-[#7A8E81] rounded-[14px] focus:ring-2 focus:ring-[#146B52] focus:border-[#146B52] text-[#1D302A] placeholder-[#7A8E81] focus:outline-none"
                      placeholder="Re-type your password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#7A8E81] hover:text-[#1D302A]"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-[#AE3535] text-sm bg-[#FCEAEA] p-3 rounded-[14px] font-medium border border-[#FCEAEA]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#146B52] text-white py-3 px-4 rounded-[14px] hover:bg-[#0E5440] focus:ring-2 focus:ring-[#146B52] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold shadow-sm"
              >
                {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setConfirmPassword('');
                }}
                className="text-[#146B52] hover:text-[#0E5440] text-sm font-semibold"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>

            {isSignUp && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                By creating an account, you agree to our terms of service and privacy policy.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
