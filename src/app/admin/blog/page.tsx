'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminBlogApi, BlogPostDetail } from '@/lib/api';

export default function AdminBlogListPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<BlogPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await adminBlogApi.getPosts(token, params);
      if (res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setPosts(list);
      } else {
        setError(res.error || 'Failed to load blog articles');
      }
    } catch (e: any) {
      setError(e.message || 'Error fetching blog articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleToggleStatus = async (post: BlogPostDetail) => {
    if (!token) return;
    const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await adminBlogApi.updatePost(post.id, { status: newStatus }, token);
      if (res.data) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!token) return;
    try {
      await adminBlogApi.deletePost(id, token);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    } catch (e: any) {
      alert(e.message || 'Failed to delete post');
    }
  };

  const totalPublished = posts.filter((p) => p.status === 'PUBLISHED').length;
  const totalDrafts = posts.filter((p) => p.status === 'DRAFT').length;
  const totalViews = posts.reduce((acc, p) => acc + (p.views_count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Blog CMS Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Publish, edit, and optimize articles for Google rankings and customer conversion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/blog/authors"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Authors</span>
          </Link>

          <Link
            href="/admin/blog/categories"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Categories</span>
          </Link>

          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Articles</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{posts.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Published</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalPublished}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalDrafts}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Readers / Views</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or content..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={fetchPosts}
              className="mt-3 px-4 py-1.5 bg-slate-100 text-xs font-bold rounded-lg text-slate-700 hover:bg-slate-200"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900">No blog articles found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first article, or run the migration command to import existing posts.
            </p>
            <Link
              href="/admin/blog/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover"
            >
              <span>Create New Article</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Article</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Author</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Views</th>
                  <th className="px-4 py-3.5">Published</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 max-w-xs sm:max-w-sm">
                      <div className="font-bold text-slate-900 line-clamp-1 hover:text-primary">
                        <Link href={`/admin/blog/${post.id}/edit`}>{post.title}</Link>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                        /blog/{post.slug}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {post.category_name || 'General'}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{post.author_name || 'Admin'}</div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(post)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          post.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            post.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{post.status}</span>
                      </button>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap font-mono font-bold text-slate-600">
                      {(post.views_count || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 inline-block transition-colors"
                        title="View Live Article"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>

                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 inline-block transition-colors"
                        title="Edit Article"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeletingId(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 inline-block transition-colors cursor-pointer"
                        title="Delete Article"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">Delete Blog Article?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                This action is permanent and cannot be undone. Any traffic to this URL will 404.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
