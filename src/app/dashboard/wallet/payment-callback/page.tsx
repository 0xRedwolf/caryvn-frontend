'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, refreshUser, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'error' | 'need_login'>('verifying');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    const reference = searchParams.get('reference') || searchParams.get('trxref') || '';

    // Store reference so it survives login redirects
    if (reference) {
      sessionStorage.setItem('pending_payment_ref', reference);
    }

    const storedRef = reference || sessionStorage.getItem('pending_payment_ref') || '';

    if (!storedRef) {
      setStatus('error');
      setMessage('No payment reference found');
      return;
    }

    if (token && !hasAttempted) {
      verifyPayment(storedRef);
    } else if (!token) {
      setStatus('need_login');
      setMessage('Please log in to verify your payment');
    }
  }, [searchParams, token, authLoading]);

  const verifyPayment = async (reference: string) => {
    if (!token) return;
    setHasAttempted(true);
    setStatus('verifying');

    try {
      const result = await walletApi.verifyTopup(reference, token);

      if (result.error) {
        setStatus('failed');
        setMessage(result.error);
        return;
      }

      const data = result.data as {
        status: string;
        message: string;
        balance?: string;
        amount?: string;
      };

      if (data?.status === 'success') {
        setStatus('success');
        setMessage(data.message || 'Payment confirmed!');
        setAmount(data.amount || '');
        setBalance(data.balance || '');
        // Clean up stored reference
        sessionStorage.removeItem('pending_payment_ref');
        // Refresh user data to update balance in sidebar
        await refreshUser();
      } else {
        setStatus('failed');
        setMessage(data?.message || 'Payment failed');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred while verifying payment');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-surface-dark rounded-2xl border border-border-dark p-8 max-w-md w-full text-center">
        {/* Verifying */}
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifying Payment</h2>
            <p className="text-text-secondary">Please wait while we confirm your payment...</p>
          </div>
        )}

        {/* Need Login */}
        {status === 'need_login' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Session Expired</h2>
            <p className="text-text-secondary">Your session expired during payment. Please log in to verify your deposit.</p>
            <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              Log In to Verify Payment
            </Link>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
            <p className="text-text-secondary">{message}</p>
            {amount && (
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <p className="text-text-secondary text-sm">Amount Added</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(amount)}</p>
              </div>
            )}
            {balance && (
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <p className="text-text-secondary text-sm">New Balance</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
              </div>
            )}
            <Link href="/dashboard/wallet" className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Wallet
            </Link>
          </div>
        )}

        {/* Failed */}
        {(status === 'failed' || status === 'error') && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Payment {status === 'failed' ? 'Failed' : 'Error'}</h2>
            <p className="text-text-secondary">{message}</p>
            <div className="flex gap-3 justify-center mt-2">
              <Link href="/dashboard/wallet" className="btn-secondary">
                Back to Wallet
              </Link>
              <button onClick={() => router.back()} className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
