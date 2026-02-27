'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Image from 'next/image';

interface PendingDeposit {
  id: string;
  amount: string;
  payment_proof: string | null;
  created_at: string;
  status: string;
}

export default function AdminPendingDepositsPage() {
  const { token } = useAuth();
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadDeposits();
  }, [token]);

  const loadDeposits = async () => {
    setLoading(true);
    const res = await adminApi.getPendingDeposits(token!);
    if (res.data) {
      setDeposits(res.data as PendingDeposit[]);
    }
    setLoading(false);
  };

  const handleVerify = async (id: string) => {
    if (!token) return;
    setActionLoading(`verify-${id}`);
    const res = await adminApi.verifyTransaction(id, token);
    setActionLoading(null);
    if (!res.error) {
      setDeposits(deposits.filter(d => d.id !== id));
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleFail = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to reject this deposit? The proof image will be permanently deleted.')) return;
    
    setActionLoading(`fail-${id}`);
    const res = await adminApi.failTransaction(id, token);
    setActionLoading(null);
    if (!res.error) {
      setDeposits(deposits.filter(d => d.id !== id));
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Manual Deposits</h1>
          <p className="text-text-secondary">Verify and approve manual user top-ups</p>
        </div>
        <button onClick={loadDeposits} className="btn-secondary flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {deposits.length === 0 ? (
        <div className="bg-surface-dark border border-border-dark rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-1">No Pending Deposits</h3>
          <p className="text-text-secondary text-sm">All manual top-ups have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deposits.map(deposit => (
            <div key={deposit.id} className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden flex flex-col">
              <div 
                className="h-48 w-full bg-surface-darker relative border-b border-border-dark group cursor-pointer"
                onClick={() => deposit.payment_proof && setSelectedImage(deposit.payment_proof)}
              >
                {deposit.payment_proof ? (
                  <>
                    {/* Using standard img to avoid next/image domain config issues with unpredictable django urls in dev */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={deposit.payment_proof} 
                      alt="Payment Proof" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>No Image Uploaded</span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <p className="text-sm text-text-secondary">Amount</p>
                     <p className="text-xl font-bold text-emerald-500">{formatCurrency(deposit.amount)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm text-text-secondary">Date</p>
                     <p className="text-sm font-medium text-white">{formatDate(deposit.created_at)}</p>
                   </div>
                 </div>
                 
                 <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-border-dark">
                   <button 
                     onClick={() => handleFail(deposit.id)}
                     disabled={actionLoading !== null}
                     className="py-2 px-3 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                   >
                     {actionLoading === `fail-${deposit.id}` ? 'Rejecting...' : 'Reject'}
                   </button>
                   <button 
                     onClick={() => handleVerify(deposit.id)}
                     disabled={actionLoading !== null}
                     className="py-2 px-3 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] shadow-emerald-500/20"
                   >
                     {actionLoading === `verify-${deposit.id}` ? 'Approving...' : 'Approve'}
                   </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedImage} 
              alt="Payment Proof Full Content" 
              className="max-w-full max-h-full object-contain cursor-default"
              onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking on the image itself
            />
            
            <button 
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
