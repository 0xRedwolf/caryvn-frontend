'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface FAQ {
  q: string;
  a: string;
}

interface BlogPostViewProps {
  post: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    read_time?: string;
    published_at?: string;
    views_count?: number;
    category_name?: string;
    author_name?: string;
    author_role?: string;
    author_bio?: string;
    author_avatar?: string;
    author_social_x?: string;
    author_social_linkedin?: string;
    faqs?: FAQ[];
    cta_title?: string;
    cta_description?: string;
    cta_button_text?: string;
    cta_url?: string;
    related_posts?: Array<{
      id: string;
      title: string;
      slug: string;
      category_name: string;
      read_time: string;
      featured_image?: string;
    }>;
  };
}

export default function BlogPostView({ post }: BlogPostViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [headings, setHeadings] = useState<Array<{ id: string; text: string }>>([]);

  // Extract headings for dynamic Table of Contents
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const articleElem = document.getElementById('article-content-body');
    if (!articleElem) return;

    const headingNodes = articleElem.querySelectorAll('h2, h3');
    const extracted: Array<{ id: string; text: string }> = [];

    headingNodes.forEach((node, i) => {
      const text = node.textContent || '';
      if (text.trim()) {
        const id = `heading-${i}`;
        node.id = id;
        extracted.push({ id, text });
      }
    });

    setHeadings(extracted);
  }, [post.content]);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareX = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this guide: "${post.title}" on Caryvn`);
    window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this guide: "${post.title}" - ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const ctaTitle = post.cta_title || 'Boost Your Social Media Accounts Now!';
  const ctaDesc =
    post.cta_description ||
    "It's fun and easy. Just choose the amount of followers, likes, or views that suits your needs, and blast off to insane account growth.";
  const ctaBtn = post.cta_button_text || 'Get Boosting Now!';
  const ctaUrl = post.cta_url || '/register';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-8 overflow-x-auto">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-slate-900 line-clamp-1">{post.title}</span>
        </nav>

        {/* Article Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Reading Column (8 cols) */}
          <article className="lg:col-span-8 space-y-8">
            {/* Category & Meta Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {post.category_name || 'Social Media Marketing'}
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                {post.read_time || '6 min read'}
              </span>
              {post.views_count ? (
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {post.views_count.toLocaleString()} views
                </span>
              ) : null}
            </div>

            {/* Article Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.18] tracking-tight">
              {post.title}
            </h1>

            {/* Author Header & Social Share Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shadow-xs">
                  {post.author_name ? post.author_name[0] : 'A'}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">{post.author_name || 'Alexander Sterling'}</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Published on{' '}
                    {new Date(post.published_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* 1-Click Social Share Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Copy link to clipboard"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Share</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareX}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Share on X"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleShareLinkedIn}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Share on LinkedIn"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Featured Hero Banner */}
            {post.featured_image && (
              <div className="aspect-video w-full relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            )}

            {/* Main Reading Body */}
            <div
              id="article-content-body"
              className="prose prose-slate prose-base sm:prose-lg max-w-none text-slate-700 leading-relaxed font-normal bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Google Schema.org Interactive FAQ Accordion */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                    ?
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Frequently Asked Questions
                  </h3>
                </div>

                <div className="space-y-3 divide-y divide-slate-100">
                  {post.faqs.map((faq, idx) => (
                    <div key={idx} className="pt-3 first:pt-0">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between text-left py-2 font-bold text-sm text-slate-900 hover:text-primary transition-colors cursor-pointer gap-4"
                      >
                        <span>{faq.q}</span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                            activeFaq === idx ? 'rotate-180 text-primary' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {activeFaq === idx && (
                        <div className="text-xs sm:text-sm text-slate-600 pb-3 pt-1 leading-relaxed pl-1 animate-in fade-in duration-150">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Author E-E-A-T Bio Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-black text-2xl flex items-center justify-center shrink-0 shadow-xs">
                {post.author_name ? post.author_name[0] : 'A'}
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <h4 className="text-lg font-black text-slate-900">{post.author_name || 'Alexander Sterling'}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary text-[10px] font-black uppercase border border-blue-100">
                    {post.author_role || 'Editor In Chief'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {post.author_bio ||
                    'Alexander is the editor-in-chief of the Caryvn blog, specializing in social media growth, digital brand building, and engagement strategy. With years of experience optimizing social panels, Alexander shares expert insights for scaling your online presence.'}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-bold text-primary">
                  {post.author_social_x && (
                    <a href={post.author_social_x} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Follow on X &rarr;
                    </a>
                  )}
                  {post.author_social_linkedin && (
                    <a href={post.author_social_linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      LinkedIn Profile &rarr;
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Targeted High-Conversion CTA Card */}
            <div className="bg-white border-2 border-primary/20 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="max-w-xl space-y-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 inline-block">
                  Caryvn Acceleration
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {ctaTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {ctaDesc}
                </p>
              </div>

              <Link
                href={ctaUrl}
                className="shrink-0 px-8 py-4 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 inline-flex items-center gap-2"
              >
                <span>{ctaBtn}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </article>

          {/* Right Sticky Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Dynamic Table of Contents Box */}
            {headings.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs lg:sticky lg:top-28">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span>Table of Contents</span>
                </h4>

                <ul className="space-y-2 text-xs font-semibold text-slate-600">
                  {headings.map((h, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => scrollToHeading(h.id)}
                        className="text-left hover:text-primary transition-colors line-clamp-1 cursor-pointer py-1"
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fast Promotion Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-center">
              <h5 className="text-base font-black text-slate-900 mb-2">
                Need Fast Engagement?
              </h5>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Connect your account and start orders with instant automated delivery.
              </p>
              <Link
                href="/services"
                className="w-full py-2.5 px-4 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors text-xs font-black inline-flex items-center justify-center gap-1.5"
              >
                <span>Browse Services</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
