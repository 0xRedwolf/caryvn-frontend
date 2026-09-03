'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { blogApi, BlogPostItem, BlogCategory } from '@/lib/api';

// Fallback articles to guarantee the page always renders even if offline or before seeding
const fallbackPosts: BlogPostItem[] = [
  {
    id: '1',
    title: 'Top 10 Best SMM Panels for Instagram, TikTok & YouTube in 2026',
    slug: 'top-10-best-smm-panels-2026',
    excerpt: 'Master the latest algorithms and market trends to skyrocket your reach. We review CaryVN, JAP, and other top SMM Panels based on speed, affordability, and quality.',
    featured_image: '/blog-hero.png',
    author_name: 'Alexander Sterling',
    category_name: 'Tools',
    category_slug: 'tools',
    status: 'PUBLISHED',
    featured: true,
    read_time: '8 min read',
    views_count: 3420,
    published_at: '2026-03-09T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
  },
  {
    id: '2',
    title: 'Best Social Media Management Tools for Agencies and Freelancers',
    slug: 'best-smm-tools-2026',
    excerpt: 'Discover the top social media management tools for 2026 and how to combine distribution software with engagement engines for maximum results.',
    featured_image: '/cat-tools.png',
    author_name: 'Alexander Sterling',
    category_name: 'Tools',
    category_slug: 'tools',
    status: 'PUBLISHED',
    featured: false,
    read_time: '7 min read',
    views_count: 1980,
    published_at: '2026-03-09T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
  },
  {
    id: '3',
    title: 'Which Social Media Platform is Best for My Business?',
    slug: 'best-platform-for-business',
    excerpt: 'Discover how to choose the right social media platform for your business in 2026 based on demographic data, user intent, and platform-specific metrics.',
    featured_image: '/cat-strategy.png',
    author_name: 'Alexander Sterling',
    category_name: 'Strategy',
    category_slug: 'strategy',
    status: 'PUBLISHED',
    featured: false,
    read_time: '6 min read',
    views_count: 2150,
    published_at: '2026-03-09T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
  },
  {
    id: '4',
    title: 'How to Increase Engagement on Underperforming Posts',
    slug: 'increase-engagement-2026',
    excerpt: 'Learn how to revive underperforming social media posts using psychological hook frameworks, Social SEO tweaks, and strategic SMM panel boosts.',
    featured_image: '/cat-strategy.png',
    author_name: 'Alexander Sterling',
    category_name: 'Strategy',
    category_slug: 'strategy',
    status: 'PUBLISHED',
    featured: false,
    read_time: '5 min read',
    views_count: 1420,
    published_at: '2026-03-09T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
  },
  {
    id: '5',
    title: 'Top Social Media Marketing Trends to Watch in 2026',
    slug: 'social-media-trends-2026',
    excerpt: 'Explore the most critical social media marketing trends of 2026, from AI-driven authenticity to the rise of social search and short-form video evolution.',
    featured_image: '/cat-trends.png',
    author_name: 'Alexander Sterling',
    category_name: 'Trends',
    category_slug: 'trends',
    status: 'PUBLISHED',
    featured: false,
    read_time: '8 min read',
    views_count: 2890,
    published_at: '2026-03-09T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
  },
  {
    id: '6',
    title: 'How to Beat the Social Media Algorithm (Instagram, TikTok, LinkedIn)',
    slug: 'beat-social-media-algorithm-2026',
    excerpt: 'Learn the underlying mechanics of the Interest Graph and how to trigger viral distribution on Instagram, TikTok, and LinkedIn in 2026.',
    featured_image: '/cat-strategy.png',
    author_name: 'Alexander Sterling',
    category_name: 'Strategy',
    category_slug: 'strategy',
    status: 'PUBLISHED',
    featured: false,
    read_time: '9 min read',
    views_count: 4120,
    published_at: '2026-03-09T00:00:00Z',
    created_at: '2026-03-09T00:00:00Z',
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>(fallbackPosts);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDynamicData = async () => {
      setLoading(true);
      try {
        const [postsRes, catRes] = await Promise.all([
          blogApi.getPosts({ category: selectedCategory !== 'all' ? selectedCategory : undefined, q: searchQuery || undefined }),
          blogApi.getCategories(),
        ]);

        if (postsRes.data) {
          const fetched = Array.isArray(postsRes.data) ? postsRes.data : postsRes.data.results || [];
          if (fetched.length > 0) {
            setPosts(fetched);
          }
        }
        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Failed to load dynamic blog posts, using fallback:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDynamicData();
  }, [selectedCategory, searchQuery]);

  // Featured post for the top hero card
  const featuredPost = useMemo(() => {
    return posts.find((p) => p.featured) || posts[0] || fallbackPosts[0];
  }, [posts]);

  // Filtered remaining articles (excluding the featured one)
  const remainingPosts = useMemo(() => {
    return posts.filter((p) => p.id !== featuredPost?.id);
  }, [posts, featuredPost]);

  const displayedPosts = remainingPosts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header Title & Intro */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 mb-4">
            Caryvn Insights & Growth
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Master Social Media Marketing
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Data-backed playbooks, algorithm breakdowns, and tactical strategies to scale your audience and dominate digital platforms in 2026.
          </p>
        </div>

        {/* Featured Hero Article */}
        {featuredPost && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col lg:flex-row mb-16 ring-1 ring-black/5 hover:border-slate-300 transition-all">
            <div className="w-full lg:w-[52%] aspect-video lg:aspect-auto bg-slate-100 relative overflow-hidden min-h-80">
              <Image
                src={featuredPost.featured_image || '/blog-hero.png'}
                alt={featuredPost.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div className="w-full lg:w-[48%] p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-white">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase">
                  Featured Masterclass
                </span>
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {featuredPost.read_time}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 mb-4 leading-tight tracking-tight hover:text-primary transition-colors">
                <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 line-clamp-3">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                    {featuredPost.author_name ? featuredPost.author_name[0] : 'A'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{featuredPost.author_name || 'Alexander Sterling'}</p>
                    <p className="text-[11px] text-slate-400">Editor In Chief</p>
                  </div>
                </div>

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
                >
                  <span>Read Full Article</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Articles
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, tools, tips..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Main Grid: Articles + Commercial Conversion Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 2 Cols: Articles Grid */}
          <div className="lg:col-span-2 space-y-6">
            {loading && posts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Fetching articles...</p>
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
                <p className="text-sm font-bold text-slate-700">No articles matched your criteria.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-1.5 bg-slate-100 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {displayedPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
                  >
                    <Link href={`/blog/${post.slug}`} className="block aspect-16/10 relative bg-slate-100 overflow-hidden">
                      <Image
                        src={post.featured_image || '/cat-strategy.png'}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 350px"
                      />
                    </Link>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {post.category_name}
                          </span>
                          <span className="text-slate-400 text-[11px] font-bold">
                            {post.read_time}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 leading-snug mb-2.5 group-hover:text-primary transition-colors line-clamp-2">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6 font-normal">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400">
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>

                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Read More</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination Load More */}
            {visibleCount < remainingPosts.length && (
              <div className="text-center pt-8">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Load More Articles</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Right 1 Col: Conversion Sidebar */}
          <aside className="space-y-6">
            {/* Boost Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-xl ring-1 ring-black/5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-5 shadow-xs">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">
                Scale Your Social Presence
              </h4>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Unlock instant delivery on Instagram, TikTok, YouTube, and Telegram services starting at just ₦50.
              </p>

              <Link
                href="/register"
                className="w-full py-3 px-4 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 mb-6"
              >
                <span>Get Started in 60 Seconds</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              {/* Quick Links */}
              <div className="space-y-2.5 text-left border-t border-slate-100 pt-5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Popular Services
                </p>
                {[
                  { name: 'Instagram Followers (High Retention)', url: '/services' },
                  { name: 'Instagram Likes & Real Comments', url: '/services' },
                  { name: 'TikTok Views & Viral Saves', url: '/services' },
                  { name: 'YouTube Watch Hours & Subscribers', url: '/services' },
                  { name: 'Telegram Channel Members', url: '/services' },
                ].map((s, idx) => (
                  <Link
                    key={idx}
                    href={s.url}
                    className="flex items-center justify-between text-xs font-bold text-slate-600 hover:text-primary transition-colors py-1 group"
                  >
                    <span>{s.name}</span>
                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            {/* Brand Authority Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-xs">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-3 inline-block">
                E-E-A-T Certified
              </span>
              <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">
                Tested by Real Marketers
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Every strategy published on Caryvn is stress-tested across real client accounts to guarantee safety and algorithm compliance.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
