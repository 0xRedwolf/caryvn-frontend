'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface PopupCard {
  id: number;
  title: string;
  description: string;
  image: string | null;
  action_url: string;
  is_active: boolean;
  order: number;
}

export default function AdminAdsPage() {
  const { token } = useAuth();
  const [popups, setPopups] = useState<PopupCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PopupCard | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (token) {
      loadPopups();
    }
  }, [token]);

  const loadPopups = async () => {
    if (!token) return;
    setLoading(true);
    const res = await adminApi.getPopups(token);
    if (res.data) {
      setPopups(res.data as PopupCard[]);
    } else {
      setError(res.error || 'Failed to load popups');
    }
    setLoading(false);
  };

  const handleEdit = (card: PopupCard) => {
    setEditingCard(card);
    setTitle(card.title || '');
    setDescription(card.description || '');
    setActionUrl(card.action_url || '');
    setOrder(card.order || 0);
    setIsActive(card.is_active ?? true);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCard(null);
    setTitle('');
    setDescription('');
    setActionUrl('');
    setOrder(0);
    setIsActive(true);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    if (!token) return;

    const res = await adminApi.deletePopup(id, token);
    if (!res.error) {
      loadPopups();
    } else {
      alert(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('action_url', actionUrl);
    formData.append('order', order.toString());
    formData.append('is_active', isActive.toString());
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    let res;
    if (editingCard) {
      res = await adminApi.updatePopup(editingCard.id, formData, token);
    } else {
      res = await adminApi.createPopup(formData, token);
    }

    if (!res.error) {
      setIsModalOpen(false);
      loadPopups();
    } else {
      alert(res.error || 'An error occurred while saving the ad');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Popup Cards</h1>
          <p className="text-text-secondary">Manage the popup cards displayed on user dashboards.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="btn-primary whitespace-nowrap text-sm sm:text-base px-3 sm:px-4 shrink-0"
        >
          <span className="hidden sm:inline">Create New Ad</span>
          <span className="sm:hidden">Create Ad</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {loading && popups.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"/>
        </div>
      ) : popups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map(popup => (
            <div key={popup.id} className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden flex flex-col">
              <div className="h-48 relative bg-surface-darker">
                {popup.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={popup.image} alt={popup.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    No Image
                  </div>
                )}
                {popup.is_active ? (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 text-white text-xs font-bold rounded">
                    ACTIVE
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-red-400 text-xs font-bold rounded">
                    INACTIVE
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">{popup.title}</h3>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {popup.description || 'No description provided.'}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">Order: {popup.order}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(popup)}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(popup.id)}
                      className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center text-text-secondary">
          No ads found. Create your first popup to display it to users.
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-dark w-full max-w-lg rounded-2xl border border-border-dark shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border-dark">
              <h2 className="text-xl font-bold text-white">
                {editingCard ? 'Edit Ad' : 'Create New Ad'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="popup-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="input-field border border-border-dark focus:border-primary" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="input-field min-h-[100px] border border-border-dark focus:border-primary" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Action URL (Optional Button Link)</label>
                  <input 
                    type="url" 
                    value={actionUrl} 
                    onChange={e => setActionUrl(e.target.value)} 
                    className="input-field border border-border-dark focus:border-primary" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Sort Order (Lower appears first)</label>
                  <input 
                    type="number" 
                    value={order} 
                    onChange={e => setOrder(parseInt(e.target.value) || 0)} 
                    className="input-field border border-border-dark focus:border-primary" 
                  />
                </div>
                
                <div className="flex items-center gap-3 mt-4">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={!!isActive} 
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-border-dark bg-surface-darker checked:bg-primary accent-primary"
                  />
                  <label htmlFor="is_active" className="text-white font-medium cursor-pointer">
                    Active (Visible to users)
                  </label>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Image (1:1 Square recommended)</label>
                  
                  {editingCard?.image && !imageFile && (
                    <div className="mb-4">
                      <p className="text-xs text-text-secondary mb-2">Current Image:</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editingCard.image} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-border-dark" />
                    </div>
                  )}

                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border-dark flex justify-end gap-3 bg-surface-darker shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-2.5 rounded-xl font-semibold text-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="popup-form" 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save Ad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
