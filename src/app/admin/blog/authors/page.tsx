'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminBlogApi, BlogAuthor } from '@/lib/api';

export default function AdminBlogAuthorsPage() {
  const { token } = useAuth();
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Editor In Chief');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAuthors = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminBlogApi.getAuthors(token);
      if (res.data) setAuthors(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreateModal = () => {
    setEditingAuthor(null);
    setName('');
    setRole('Editor In Chief');
    setBio('');
    setAvatarUrl('');
    setSocialX('');
    setSocialLinkedin('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (author: BlogAuthor) => {
    setEditingAuthor(author);
    setName(author.name || '');
    setRole(author.role || 'Editor In Chief');
    setBio(author.bio || '');
    setAvatarUrl(author.avatar_url || '');
    setSocialX(author.social_x || '');
    setSocialLinkedin(author.social_linkedin || '');
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;

    setSaving(true);
    setError('');
    const payload = {
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim() || null,
      social_x: socialX.trim() || null,
      social_linkedin: socialLinkedin.trim() || null,
    };

    try {
      if (editingAuthor) {
        const res = await adminBlogApi.updateAuthor(editingAuthor.id, payload, token);
        if (res.data) {
          setAuthors((prev) => prev.map((a) => (a.id === editingAuthor.id ? res.data! : a)));
          setModalOpen(false);
        } else {
          setError('Failed to update author');
        }
      } else {
        const res = await adminBlogApi.createAuthor(payload, token);
        if (res.data) {
          setAuthors((prev) => [...prev, res.data!]);
          setModalOpen(false);
        } else {
          setError('Failed to create author');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error saving author');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this author?')) return;
    try {
      await adminBlogApi.deleteAuthor(id, token);
      setAuthors((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/blog" className="text-xs font-bold text-primary hover:underline">
              &larr; Back to Articles
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Blog Authors (E-E-A-T Management)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage author profiles, roles, and social proof links to boost Google Quality Rater authority scores.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Author</span>
        </button>
      </div>

      {/* Authors List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading authors...</p>
          </div>
        ) : authors.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No authors found. Click &quot;New Author&quot; above to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {authors.map((author) => (
              <div key={author.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                    {author.name ? author.name[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">{author.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-primary text-[10px] font-extrabold uppercase border border-blue-100">
                        {author.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xl">
                      {author.bio || 'No biography entered.'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      {author.social_x && <span className="hover:text-slate-700">X: {author.social_x}</span>}
                      {author.social_linkedin && <span className="hover:text-slate-700">LinkedIn: {author.social_linkedin}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(author)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(author.id)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Author Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingAuthor ? 'Edit Author Profile' : 'Add New Author'}
            </h3>

            {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Author Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alexander Sterling"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Editor In Chief, Social Media Strategist"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Short author background explaining experience..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">X (Twitter) Profile URL</label>
                <input
                  type="url"
                  value={socialX}
                  onChange={(e) => setSocialX(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary font-black text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Author'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
