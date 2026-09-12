'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const result = await authApi.requestPasswordReset(email);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ 
          type: 'success', 
          text: 'If that email exists, a reset link has been sent. Please check your inbox.' 
        });
        setEmail('');
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <Link href="/" className="cursor-pointer">
              <Logo width={160} height={32} />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password</h1>
          <p className="text-slate-600 text-sm">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' 
                : 'bg-red-500/10 border border-red-500/20 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-200">
            <Link 
              href="/login" 
              className="text-sm text-slate-600 hover:text-primary transition-colors font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
