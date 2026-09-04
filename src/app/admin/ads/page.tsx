'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, PopupCard } from '@/lib/api';

export default function AdminAdsPage() {
  const { token } = useAuth();
  const [popups, setPopups] = useState<PopupCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [placementFilter, setPlacementFilter] = useState<'ALL' | 'POPUP' | 'BANNER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingCard, setEditingCard] = useState<PopupCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingCard, setDeletingCard] = useState<PopupCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [imageErrorIds, setImageErrorIds] = useState<Record<number, boolean>>({});

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionText, setActionText] = useState('Learn More');
  const [placementType, setPlacementType] = useState<'POPUP' | 'BANNER'>('POPUP');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Preview Mode inside Modal
  const [previewTab, setPreviewTab] = useState<'POPUP' | 'BANNER'>('POPUP');

  const loadPopups = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminApi.getPopups(token);
      if (res.data) {
        setPopups(res.data);
      } else {
        setError(res.error || 'Failed to load popups');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPopups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = popups.length;
    const active = popups.filter((p) => p.is_active).length;
    const totalImpressions = popups.reduce((acc, p) => acc + (p.impressions_count || 0), 0);
    const totalClicks = popups.reduce((acc, p) => acc + (p.clicks_count || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';
    return { total, active, totalImpressions, totalClicks, ctr };
  }, [popups]);

  // Filtered Popups
  const filteredPopups = useMemo(() => {
    return popups.filter((p) => {
      if (placementFilter !== 'ALL' && p.placement_type !== placementFilter) return false;
      if (statusFilter === 'ACTIVE' && !p.is_active) return false;
      if (statusFilter === 'INACTIVE' && p.is_active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [popups, placementFilter, statusFilter, searchQuery]);

  const handleCreateNew = () => {
    setEditingCard(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setActionUrl('');
    setActionText('Learn More');
    setPlacementType('POPUP');
    setPreviewTab('POPUP');
    setOrder(0);
    setIsActive(true);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEdit = (card: PopupCard) => {
    setEditingCard(card);
    setTitle(card.title || '');
    setDescription(card.description || '');
    setImageUrl(card.image || '');
    setActionUrl(card.action_url || '');
    setActionText(card.action_text || 'Learn More');
    setPlacementType(card.placement_type || 'POPUP');
    setPreviewTab(card.placement_type || 'POPUP');
    setOrder(card.order || 0);
    setIsActive(card.is_active ?? true);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id: number) => {
    if (!token) return;
    try {
      const res = await adminApi.togglePopupActive(id, token);
      if (res.data) {
        setPopups((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: res.data!.is_active } : p))
        );
      } else {
        setError(res.error || 'Failed to toggle ad status');
      }
    } catch (err: any) {
      setError(err.message || 'Error toggling status');
    }
  };

  const confirmDelete = async () => {
    if (!deletingCard || !token) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await adminApi.deletePopup(deletingCard.id, token);
      if (!res.error) {
        setPopups((prev) => prev.filter((p) => p.id !== deletingCard.id));
        setDeletingCard(null);
      } else {
        setDeleteError(res.error || 'Failed to delete ad');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting ad');
    } finally {
      setIsDeleting(false);
    }
  };

  // Image Upload to Cloudinary CDN
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setModalError('');
    try {
      const res = await adminApi.uploadPopupImage(file, token);
      if (res.url) {
        setImageUrl(res.url);
      } else {
        setModalError(res.error || 'Failed to upload image to Cloudinary');
      }
    } catch (err: any) {
      setModalError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setModalError('');
    const payload = {
      title,
      description,
      image: imageUrl,
      action_url: actionUrl,
      action_text: actionText || 'Learn More',
      placement_type: placementType,
      order,
      is_active: isActive,
    };

    try {
      let res;
      if (editingCard) {
        res = await adminApi.updatePopup(editingCard.id, payload, token);
      } else {
        res = await adminApi.createPopup(payload, token);
      }

      if (res.data) {
        setIsModalOpen(false);
        loadPopups();
      } else {
        setModalError(res.error || 'An error occurred while saving the ad');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error saving ad');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-primary border border-blue-100">
              Engagement Hub
            </span>
            <span className="text-xs text-slate-500 font-semibold">Cloudinary CDN Powered</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Ads & Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deploy modal popups and in-feed dashboard banners with live interactive preview and conversion metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Ad</span>
        </button>
      </div>

      {/* Metrics Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Ads</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">{metrics.total}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">All configured campaigns</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-3">{metrics.active}</div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Currently visible to users</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Views</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            {metrics.totalImpressions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">User dashboard impressions</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clicks & CTR</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalClicks.toLocaleString()}
            </span>
            <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
              {metrics.ctr}% CTR
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Conversions to action URL</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Placement Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPlacementFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                placementFilter === 'ALL' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setPlacementFilter('POPUP')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                placementFilter === 'POPUP' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modal
            </button>
            <button
              type="button"
              onClick={() => setPlacementFilter('BANNER')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                placementFilter === 'BANNER' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Banner
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Content List */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {error}
        </div>
      )}

      {loading && popups.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading promotional campaigns...</p>
        </div>
      ) : filteredPopups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPopups.map((popup) => {
            const ctr =
              popup.impressions_count > 0
                ? ((popup.clicks_count / popup.impressions_count) * 100).toFixed(1)
                : '0.0';

            return (
              <div
                key={popup.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col"
              >
                {/* Visual Banner Header */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {popup.image && !imageErrorIds[popup.id] ? (
                    <Image
                      src={popup.image}
                      alt={popup.title || 'Ad Image'}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() => setImageErrorIds((prev) => ({ ...prev, [popup.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                      <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[11px] font-semibold">No Image Provided</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs">
                      {popup.placement_type === 'BANNER' ? 'In-Feed Banner' : 'Popup Modal'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-[10px] font-extrabold bg-white/95 text-slate-700 border border-slate-200/80 shadow-xs backdrop-blur-xs">
                      Order: {popup.order}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(popup.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider transition-colors shadow-xs cursor-pointer ${
                        popup.is_active
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {popup.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                      {popup.title || 'Untitled Campaign'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {popup.description || 'No description provided.'}
                    </p>

                    {popup.action_url && (
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-primary font-bold truncate">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="truncate">{popup.action_text || 'Learn More'} &rarr; {popup.action_url}</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Views</span>
                        <span className="font-extrabold text-slate-900">{popup.impressions_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Clicks</span>
                        <span className="font-extrabold text-slate-900">{popup.clicks_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">CTR</span>
                        <span className="font-extrabold text-purple-600">{ctr}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(popup)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Edit Ad"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('');
                          setDeletingCard(popup);
                        }}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete Ad"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No campaigns found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || placementFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No ads match your selected filters. Try clearing your search.'
              : 'Create your first promotional popup or banner to engage users on their dashboard.'}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Create New Campaign
          </button>
        </div>
      )}

      {/* Editor Modal with Real-Time Interactive Device Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingCard ? 'Edit Campaign' : 'Create New Campaign'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live real-time preview updates on the right as you configure your ad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Split Screen Form & Live Preview */}
            <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Controls (Left 7 Columns) */}
              <form id="popup-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
                {modalError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    {modalError}
                  </div>
                )}
                {/* Placement Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ad Placement Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPlacementType('POPUP');
                        setPreviewTab('POPUP');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        placementType === 'POPUP'
                          ? 'border-primary bg-blue-50/50 ring-1 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 ${placementType === 'POPUP' ? 'text-primary' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-extrabold text-slate-900">Modal Popup</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Lightbox popup. Best for high-impact promos.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlacementType('BANNER');
                        setPreviewTab('BANNER');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        placementType === 'BANNER'
                          ? 'border-primary bg-blue-50/50 ring-1 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 ${placementType === 'BANNER' ? 'text-primary' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        <span className="text-xs font-extrabold text-slate-900">In-Feed Banner</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Full-bleed cinematic promotional card on the user new order page.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., 50% Weekend Deposit Bonus"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description Body
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your promotion, terms, or announcement in detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary min-h-22.5"
                  />
                </div>

                {/* Image Upload (Cloudinary CDN) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Promotional Image
                    </label>
                    <span className="text-[10px] text-primary font-bold">Cloudinary WebP Delivery</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0">
                        {uploadingImage ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Uploading to CDN...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Choose Image File</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">or enter direct URL below:</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/... or image link"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA URL & Button Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={actionText}
                      onChange={(e) => setActionText(e.target.value)}
                      placeholder="e.g., Claim Bonus, Learn More"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Action URL
                    </label>
                    <input
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="e.g., /services or https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Sort Order & Active Toggle */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Lower numbers appear first</span>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
                      />
                      <span className="text-xs font-extrabold text-slate-800">Active (Visible to users)</span>
                    </label>
                  </div>
                </div>
              </form>

              {/* Live Interactive Preview Device (Right 5 Columns) */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Live User Preview
                    </span>
                  </div>

                  {/* Preview Tabs */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('POPUP')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        previewTab === 'POPUP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Modal View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('BANNER')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        previewTab === 'BANNER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Banner View
                    </button>
                  </div>
                </div>

                {/* Device Canvas Frame */}
                <div className="bg-slate-100 rounded-3xl p-4 border border-slate-200 flex-1 flex items-center justify-center min-h-95">
                  {previewTab === 'POPUP' ? (
                    /* Modal Card Preview */
                    <div className="w-full max-w-[320px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                      {/* Simulated Close Icon */}
                      <div className="relative w-full aspect-4/3 bg-slate-50 overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt="Preview banner"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="text-center p-4 text-slate-300">
                            <svg className="w-12 h-12 mx-auto mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase">Image Preview Canvas (4:3)</span>
                          </div>
                        )}

                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/90 text-slate-700 border border-slate-200/80 flex items-center justify-center shadow-xs backdrop-blur-xs">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>

                      <div className="p-3.5 text-center">
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                          {title || 'Your Headline Here'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                          {description || 'This is how your description text will appear to visitors.'}
                        </p>

                        <div className="mt-3">
                          <span className="inline-block w-full py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-xs">
                            {actionText || 'Learn More'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Dashboard In-Feed Banner Preview (Full-Bleed, ZERO dark scrim, ZERO plaque covering image) */
                    <div className="relative w-full min-h-48 rounded-3xl overflow-hidden shadow-md border border-slate-200/50 flex flex-col justify-between p-4 bg-slate-900">
                      {/* Background Image (Full-Bleed) */}
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt="Banner preview"
                          fill
                          className="object-cover object-center"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Upload Banner Creative
                          </span>
                        </div>
                      )}

                      {/* Top Bar: Badge & Slide Dots */}
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-white/95 text-primary backdrop-blur-md border border-white/90 shadow-sm">
                          Special Announcement
                        </span>
                        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/80 shadow-xs">
                          <span className="w-3 h-1 bg-primary rounded-full" />
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        </div>
                      </div>

                      {/* Main Text Content: DIRECT ON IMAGE with pure white typography and targeted shadow */}
                      <div className="relative z-10 mt-3 max-w-md">
                        <h4
                          className="text-sm font-black tracking-tight leading-snug line-clamp-1"
                          style={{
                            color: '#ffffff',
                            textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.9)'
                          }}
                        >
                          {title || 'Banner Headline Here'}
                        </h4>
                        <p
                          className="text-[11px] font-medium mt-0.5 line-clamp-2 leading-relaxed"
                          style={{
                            color: 'rgba(255, 255, 255, 0.95)',
                            textShadow: '0 1px 6px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.85)'
                          }}
                        >
                          {description || 'Promotional message text displayed inside the dashboard.'}
                        </p>
                        <div className="mt-3">
                          <span className="inline-block px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-[11px] font-black shadow-lg">
                            {actionText || 'Learn More'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="popup-form"
                disabled={submitting || uploadingImage}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving Campaign...' : editingCard ? 'Update Campaign' : 'Publish Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingCard && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">Delete Ad Campaign?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-800">&ldquo;{deletingCard.title || 'Untitled Campaign'}&rdquo;</span>? This action is permanent and cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingCard(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
