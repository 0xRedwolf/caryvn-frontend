'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminBlogApi, BlogCategory } from '@/lib/api';

export default function AdminBlogCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminBlogApi.getCategories(token);
      if (res.data) setCategories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setError('');
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;

    setSaving(true);
    setError('');
    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
    };

    try {
      if (editingCategory) {
        const res = await adminBlogApi.updateCategory(editingCategory.id, payload, token);
        if (res.data) {
          setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? res.data! : c)));
          setModalOpen(false);
        } else {
          setError('Failed to update category');
        }
      } else {
        const res = await adminBlogApi.createCategory(payload, token);
        if (res.data) {
          setCategories((prev) => [...prev, res.data!]);
          setModalOpen(false);
        } else {
          setError('Failed to create category');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminBlogApi.deleteCategory(id, token);
      setCategories((prev) => prev.filter((c) => c.id !== id));
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
            Blog Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize articles into thematic silos to improve topical authority and Google site indexing.
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
          <span>New Category</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No categories found. Click &quot;New Category&quot; above to add one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{cat.name}</h3>
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      /{cat.slug}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      ({cat.posts_count || 0} articles)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xl">
                    {cat.description || 'No description entered.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
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

      {/* Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>

            {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Tools, Strategy, Trends"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tools"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Short description for category hub..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
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
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
