'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminBlogApi, BlogPostDetail } from '@/lib/api';
import BlogArticleForm from '@/components/admin/BlogArticleForm';

export default function AdminEditArticlePage() {
  const params = useParams();
  const id = params?.id as string;
  const { token } = useAuth();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    const loadPost = async () => {
      setLoading(true);
      try {
        const res = await adminBlogApi.getPost(id, token);
        if (res.data) {
          setPost(res.data);
        } else {
          setError(res.error || 'Failed to load article');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching article');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [token, id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading article details...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-bold text-rose-600 mb-2">{error || 'Article not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <BlogArticleForm initialPost={post} isEditing />
    </div>
  );
}
