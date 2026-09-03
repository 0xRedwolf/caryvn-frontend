'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { adminBlogApi, BlogAuthor, BlogCategory, BlogPostDetail } from '@/lib/api';
import CustomSelect from '@/components/CustomSelect';

interface BlogArticleFormProps {
  initialPost?: BlogPostDetail;
  isEditing?: boolean;
}

export default function BlogArticleForm({ initialPost, isEditing = false }: BlogArticleFormProps) {
  const { token } = useAuth();
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [slugManual, setSlugManual] = useState(Boolean(initialPost?.slug));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [featuredImage, setFeaturedImage] = useState(initialPost?.featured_image || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Author & Category
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState(initialPost?.author?.id || initialPost?.author_id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialPost?.category?.id || initialPost?.category_id || '');

  // Status & Visibility
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(initialPost?.status || 'PUBLISHED');
  const [featured, setFeatured] = useState(initialPost?.featured || false);
  const [readTime, setReadTime] = useState(initialPost?.read_time || '5 min read');

  // SEO & Meta
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialPost?.seo_description || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialPost?.canonical_url || '');
  const [focusKeyword, setFocusKeyword] = useState(initialPost?.focus_keyword || '');

  // FAQs List
  const [faqs, setFaqs] = useState<Array<{ q: string; a: string }>>(
    initialPost?.faqs && Array.isArray(initialPost.faqs) ? initialPost.faqs : []
  );

  // Targeted CTA
  const [ctaTitle, setCtaTitle] = useState(initialPost?.cta_title || 'Boost Your Social Media Accounts Now!');
  const [ctaDesc, setCtaDesc] = useState(
    initialPost?.cta_description ||
      "It's fun and easy. Just choose the amount of followers, likes, or views that suits your needs, and blast off to insane account growth."
  );
  const [ctaButtonText, setCtaButtonText] = useState(initialPost?.cta_button_text || 'Get Boosting Now!');
  const [ctaUrl, setCtaUrl] = useState(initialPost?.cta_url || '/register');

  // UI State
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Authors and Categories
  useEffect(() => {
    if (!token) return;
    const loadMetadata = async () => {
      try {
        const [authRes, catRes] = await Promise.all([
          adminBlogApi.getAuthors(token),
          adminBlogApi.getCategories(token),
        ]);
        if (authRes.data) setAuthors(authRes.data);
        if (catRes.data) setCategories(catRes.data);

        // Auto-select first author/category if none chosen
        if (!selectedAuthorId && authRes.data?.length) {
          setSelectedAuthorId(authRes.data[0].id);
        }
        if (!selectedCategoryId && catRes.data?.length) {
          setSelectedCategoryId(catRes.data[0].id);
        }
      } catch (e) {
        console.error('Failed to load blog taxonomies:', e);
      }
    };
    loadMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-generate slug from title if not manually customized
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
    // Auto-calculate estimated read time based on word count
    const words = content.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    setReadTime(`${mins} min read`);
  };

  // Cloudinary / Local Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingImage(true);
    setErrorMessage('');
    try {
      const res = await adminBlogApi.uploadImage(file, token);
      if (res.url) {
        setFeaturedImage(res.url);
      } else {
        setErrorMessage(res.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Image upload error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // FAQ handlers
  const handleAddFaq = () => {
    setFaqs([...faqs, { q: '', a: '' }]);
  };

  const handleUpdateFaq = (idx: number, field: 'q' | 'a', value: string) => {
    const next = [...faqs];
    next[idx][field] = value;
    setFaqs(next);
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  // CTA Preset Presets
  const applyCtaPreset = (preset: 'instagram' | 'tiktok' | 'youtube' | 'general') => {
    if (preset === 'instagram') {
      setCtaTitle('Explode Your Instagram Reach & Followers');
      setCtaDesc('Accelerate your account growth with premium Instagram followers, likes, views, and auto-drip engagement.');
      setCtaButtonText('Boost Instagram Now');
      setCtaUrl('/services');
    } else if (preset === 'tiktok') {
      setCtaTitle('Hit the TikTok FYP Consistently');
      setCtaDesc('Fuel your video momentum with high-retention TikTok views, shares, and algorithmic engagement.');
      setCtaButtonText('Boost TikTok Growth');
      setCtaUrl('/services');
    } else if (preset === 'youtube') {
      setCtaTitle('Monetize Your YouTube Channel Faster');
      setCtaDesc('Hit watch hour thresholds and subscriber milestones with dependable, high-retention promotion.');
      setCtaButtonText('Boost YouTube Channel');
      setCtaUrl('/services');
    } else {
      setCtaTitle('Boost Your Social Media Accounts Now!');
      setCtaDesc("It's fun and easy. Just choose the amount of followers, likes, or views that suits your needs, and blast off to insane account growth.");
      setCtaButtonText('Get Boosting Now!');
      setCtaUrl('/register');
    }
  };

  // Markdown / HTML insertion helpers
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('blog-content-area') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected.length || 4));
    }, 10);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!title.trim()) {
      setErrorMessage('Please provide an article title.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Article content cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload: any = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || seoDescription.trim(),
      content: content.trim(),
      featured_image: featuredImage.trim() || null,
      author_id: selectedAuthorId || null,
      category_id: selectedCategoryId || null,
      status,
      featured,
      read_time: readTime,
      seo_title: seoTitle.trim() || title.trim(),
      seo_description: seoDescription.trim() || excerpt.trim(),
      canonical_url: canonicalUrl.trim() || null,
      focus_keyword: focusKeyword.trim(),
      faqs: faqs.filter((f) => f.q.trim() && f.a.trim()),
      cta_title: ctaTitle.trim(),
      cta_description: ctaDesc.trim(),
      cta_button_text: ctaButtonText.trim(),
      cta_url: ctaUrl.trim(),
    };

    try {
      if (isEditing && initialPost) {
        const res = await adminBlogApi.updatePost(initialPost.id, payload, token);
        if (res.data) {
          setSuccessMessage('Article updated successfully!');
          setTimeout(() => router.push('/admin/blog'), 800);
        } else {
          setErrorMessage(res.error || 'Failed to update article.');
        }
      } else {
        const res = await adminBlogApi.createPost(payload, token);
        if (res.data) {
          setSuccessMessage('Article published successfully!');
          setTimeout(() => router.push('/admin/blog'), 800);
        } else {
          setErrorMessage(res.error || 'Failed to create article.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving article.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {isEditing ? 'Edit Blog Article' : 'Compose New Article'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Craft high-ranking SEO content with dynamic CTAs and rich schema markup.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{isEditing ? 'Save Changes' : 'Publish Article'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Editor & Right Meta Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main Content Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Top 10 Best SMM Panels for Instagram and TikTok in 2026"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
                spellCheck={false}
                data-gramm="false"
                data-enable-grammarly="false"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  URL Slug
                </label>
                <button
                  type="button"
                  onClick={() => setSlugManual(!slugManual)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  {slugManual ? 'Reset to Auto-Slug' : 'Edit Slug Manually'}
                </button>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-500">
                <span>/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(e.target.value);
                  }}
                  className="flex-1 bg-transparent font-bold text-slate-900 outline-none ml-0.5"
                  placeholder="article-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Excerpt / Summary
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="Short 2-sentence summary that appears on cards and search result snippets..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Featured Image Box (Cloudinary Upload) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Featured Cover Image
                </label>
                <p className="text-[11px] text-slate-400">
                  Uploaded to Cloudinary
                </p>
              </div>

              {featuredImage && featuredImage.includes('cloudinary') && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-primary border border-blue-200">
                  Cloudinary CDN
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {featuredImage ? (
                <div className="relative w-full sm:w-48 aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                  <Image
                    src={featuredImage}
                    alt="Featured preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 200px"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-48 aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 p-3 text-center"
                >
                  <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[11px] font-bold text-slate-600">
                    {isUploadingImage ? 'Uploading...' : 'Upload Cover'}
                  </span>
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isUploadingImage ? 'Uploading to Cloudinary...' : 'Choose Image File'}
                  </button>
                  <span className="text-[11px] text-slate-400">or enter direct URL below:</span>
                </div>

                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or /cat-strategy.png"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rich Content Editor */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Editor Toolbar & Tabs */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'write'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Write Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Preview Layout
                </button>
              </div>

              {activeTab === 'write' && (
                <div className="flex items-center gap-1 text-slate-600">
                  <button
                    type="button"
                    onClick={() => insertFormatting('<h3><strong>', '</strong></h3>\n')}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-xs font-bold"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<strong>', '</strong>')}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-xs font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<em>', '</em>')}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-xs italic font-serif"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>\n')}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-xs"
                    title="Bullet List"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<a href="https://..." class="text-primary hover:underline">', '</a>')}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-xs"
                    title="Insert Link"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<br />\n')}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-xs"
                    title="Line Break"
                  >
                    &lt;br&gt;
                  </button>
                </div>
              )}
            </div>

            {/* Editor Body */}
            {activeTab === 'write' ? (
              <textarea
                id="blog-content-area"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder="Write your article in HTML or formatted text... You can include <h3>, <p>, <ul>, <strong>, etc."
                className="w-full p-6 text-sm text-slate-900 font-mono leading-relaxed outline-none resize-y"
                required
                spellCheck={false}
                data-gramm="false"
                data-enable-grammarly="false"
              />
            ) : (
              <div className="p-8 max-w-none prose prose-slate min-h-95">
                <div dangerouslySetInnerHTML={{ __html: content || '<p className="text-slate-400">Nothing to preview yet.</p>' }} />
              </div>
            )}

            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
              <span>Estimated: {readTime}</span>
            </div>
          </div>

          {/* Interactive FAQ Builder (Schema.org) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  FAQ Schema Builder
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically generates Google Schema.org `FAQPage` rich snippets to show interactive accordion questions in search results.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddFaq}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Question</span>
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                No FAQs added. Click &quot;Add Question&quot; above to add Google SERP FAQ rich snippets.
              </div>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Question #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      type="text"
                      value={faq.q}
                      onChange={(e) => handleUpdateFaq(idx, 'q', e.target.value)}
                      placeholder="e.g. Can SMM panels help small businesses grow?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none"
                    />

                    <textarea
                      value={faq.a}
                      onChange={(e) => handleUpdateFaq(idx, 'a', e.target.value)}
                      rows={2}
                      placeholder="e.g. Yes. Small businesses often use SMM panels to boost engagement..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & SEO (1 Col) */}
        <div className="space-y-6">
          {/* Publishing & Taxonomy Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Publishing Settings
            </h3>

            <CustomSelect
              label="Status"
              value={status}
              onChange={(val) => setStatus(val)}
              options={[
                { value: 'PUBLISHED', label: 'Published (Live to readers & Google)', badge: 'Live' },
                { value: 'DRAFT', label: 'Draft (Saved in admin only)', badge: 'Draft' },
              ]}
            />

            <CustomSelect
              label="Author (E-E-A-T)"
              value={selectedAuthorId}
              onChange={(val) => setSelectedAuthorId(val)}
              placeholder="Select author..."
              options={authors.map((a) => ({
                value: a.id,
                label: a.name,
                sublabel: a.role,
              }))}
            />

            <CustomSelect
              label="Category"
              value={selectedCategoryId}
              onChange={(val) => setSelectedCategoryId(val)}
              placeholder="Select category..."
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
                sublabel: `/${c.slug}`,
              }))}
            />

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Featured Article</span>
                <span className="text-[11px] text-slate-400">Pin to blog hero card</span>
              </div>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-primary rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* Google Search SERP Preview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Google SERP Preview
            </h3>

            {/* SERP Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500 font-mono truncate">
                https://www.caryvn.com/blog/{slug || 'article-slug'}
              </div>
              <div className="text-sm font-bold text-blue-700 line-clamp-1 hover:underline cursor-pointer">
                {seoTitle || title || 'Your Article Title'} - Caryvn
              </div>
              <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {seoDescription || excerpt || 'Enter meta description to preview how your article appears in Google search results.'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">SEO Title Override</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Leave blank to use article title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600">Meta Description</label>
                <span className={`text-[10px] font-mono ${seoDescription.length > 160 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                  {seoDescription.length}/160
                </span>
              </div>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                placeholder="Optimal length is between 130 to 160 characters..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Focus Keyword</label>
              <input
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="e.g. best smm panel 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Conversion CTA Customizer */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Targeted Conversion CTA
              </h3>
            </div>

            <p className="text-[11px] text-slate-500">
              Pick a high-margin service to promote specifically at the footer of this article:
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyCtaPreset('instagram')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Instagram
              </button>
              <button
                type="button"
                onClick={() => applyCtaPreset('tiktok')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                TikTok
              </button>
              <button
                type="button"
                onClick={() => applyCtaPreset('youtube')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                YouTube
              </button>
              <button
                type="button"
                onClick={() => applyCtaPreset('general')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                General SMM
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">CTA Headline</label>
              <input
                type="text"
                value={ctaTitle}
                onChange={(e) => setCtaTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Button Text & Target URL</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={ctaButtonText}
                  onChange={(e) => setCtaButtonText(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none"
                  placeholder="Button label"
                />
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none font-mono"
                  placeholder="/services"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
