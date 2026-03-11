'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BlogPage() {
  const [visibleCount, setVisibleCount] = useState(4);
  const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('latest');

  const blogPosts = [
    {
      title: 'Best Social Media Management Tools for Agencies and Freelancers',
      excerpt: 'Discover the top social media management tools for 2026 and how to combine distribution software with engagement engines for maximum results.',
      date: 'March 9, 2026',
      slug: 'best-smm-tools-2026',
      category: 'Tools',
    },
    {
      title: 'Which Social Media Platform is Best for My Business?',
      excerpt: 'Discover how to choose the right social media platform for your business in 2026 based on demographic data, user intent, and platform-specific metrics.',
      date: 'March 9, 2026',
      slug: 'best-platform-for-business',
      category: 'Strategy',
    },
    {
      title: 'How to Increase Engagement on Underperforming Posts',
      excerpt: 'Learn how to revive underperforming social media posts using psychological hook frameworks, Social SEO tweaks, and strategic SMM panel boosts.',
      date: 'March 9, 2026',
      slug: 'increase-engagement-2026',
      category: 'Strategy',
    },
    {
      title: 'Top Social Media Marketing Trends to Watch in 2026',
      excerpt: 'Explore the most critical social media marketing trends of 2026, from AI-driven authenticity to the rise of social search and short-form video evolution.',
      date: 'March 9, 2026',
      slug: 'social-media-trends-2026',
      category: 'Trends',
    },
    {
      title: 'How Often Should a Business Post on Social Media?',
      excerpt: 'Discover the optimal posting frequency and peak engagement windows for Instagram, TikTok, LinkedIn, and more in 2026.',
      date: 'March 9, 2026',
      slug: 'how-often-to-post-2026',
      category: 'Strategy',
    },
    {
      title: 'How to Beat the Social Media Algorithm (Instagram, TikTok, LinkedIn)',
      excerpt: 'Learn the underlying mechanics of the Interest Graph and how to trigger viral distribution on Instagram, TikTok, and LinkedIn in 2026.',
      date: 'March 9, 2026',
      slug: 'beat-social-media-algorithm-2026',
      category: 'Strategy',
    },
    {
      title: 'Organic vs. Paid Social Media: Which is Better for Growth?',
      excerpt: 'Explore the key differences between organic and paid social media growth in 2026. Learn how to balance both strategies for maximum ROI.',
      date: 'March 9, 2026',
      slug: 'organic-vs-paid-social-2026',
      category: 'Strategy',
    },
    {
      title: 'What is an SMM Panel and How Can It Boost Your Business?',
      excerpt: 'Learn how modern SMM panels provide a centralized, automated platform for social media growth, utilizing API integration and drip-feed systems.',
      date: 'March 9, 2026',
      slug: 'what-is-an-smm-panel',
      category: 'Guides',
    },
    {
      title: 'The Ultimate Guide to TikTok Algorithm in 2026',
      excerpt: 'Discover exactly how TikTok decides which videos go viral and how you can optimize your content to hit the For You Page consistently.',
      date: 'March 5, 2026',
      slug: 'tiktok-algorithm-2026',
      category: 'TikTok',
    },
    {
      title: 'Why Social Proof is Critical for E-commerce',
      excerpt: 'Learn why having a strong follower base and engagement metrics directly impacts your conversion rates and overall brand trust in e-commerce.',
      date: 'February 28, 2026',
      slug: 'social-proof-ecommerce',
      category: 'Strategy',
    },
    {
      title: 'Instagram vs. YouTube: Where Should You Invest?',
      excerpt: 'A comprehensive breakdown of the ROI you can expect from building an audience on Instagram compared to YouTube in today\'s digital landscape.',
      date: 'February 15, 2026',
      slug: 'instagram-vs-youtube-roi',
      category: 'Strategy',
    },
    {
      title: 'Top 10 Best SMM Panels for Instagram, TikTok & YouTube in 2026',
      excerpt: 'Master the latest algorithms and market trends to skyrocket your reach. We review CaryVN, JAP, and other top SMM Panels based on speed.',
      date: 'March 8, 2026',
      slug: 'top-10-best-smm-panels-2026',
      category: 'Tools',
    },
  ];


  const getCategoryThumb = (category: string) => {
    switch(category.toLowerCase()) {
      case 'strategy': return '/cat-strategy.svg';
      case 'tools': return '/cat-tools.png';
      case 'trends': return '/cat-trends.png';
      case 'guides': return '/cat-guides.png';
      case 'tiktok growth': return '/cat-tiktok.png';
      default: return '/cat-strategy.png';
    }
  };

  const handleTrendingClick = () => {
    setActiveTab('trending');
    const section = document.getElementById('trending-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">Caryvn Official Blog</h1>
          <p className="text-text-secondary text-lg">
            Stay up-to-date with latest news and tips from our team at Caryvn. We will give you Tips and Tricks to Boost your social media audience.
          </p>
        </div>

        {/* Featured Hero Article */}
        <div className="bg-surface-dark rounded-[2rem] border border-border-dark overflow-hidden flex flex-col lg:flex-row mb-16 shadow-lg relative">
          <div className="w-full lg:w-[55%] aspect-video lg:aspect-auto bg-primary/5 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none"></div>
            <Image 
              src="/blog-hero.svg" 
              alt="Top SMM Panels 2026 Visualization" 
              width={800}
              height={500}
              className="w-full h-full object-cover relative z-0"
            />
          </div>
          
          <div className="w-full lg:w-[45%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center bg-surface-dark">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-widest uppercase">Featured Article</span>
              <span className="text-text-secondary text-sm font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-border-dark"></span>
                8 min read
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-[1.15] tracking-tight">
              Top 10 Best SMM Panels for Instagram, TikTok & YouTube in 2026
            </h2>
            <p className="text-text-secondary text-base lg:text-lg mb-10 line-clamp-3 leading-relaxed">
              Master the latest algorithms and market trends to skyrocket your reach. We review CaryVN, JAP, and other top SMM Panels based on speed, affordability, and quality.
            </p>
            <Link href="/blog/top-10-best-smm-panels-2026" className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover transition-all hover:-translate-y-1 text-white font-bold py-4 px-8 rounded-xl shadow-glow hover:shadow-glow-lg w-fit text-[17px]">
              Read Full Article 
              <svg className="w-5 h-5 ml-2 stroke-[2.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Two Column Layout (Main content + Sidebar) */}
        <div className="flex flex-col xl:flex-row gap-12 xl:gap-14">
          
          {/* Main Left Content: Recent Articles */}
          <div className="flex-1 w-full lg:max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-2xl font-extrabold text-white tracking-tight">Recent Articles</h3>
              <div className="flex items-center bg-surface-dark border border-border-dark rounded-full p-1 self-start sm:self-auto shadow-sm">
                <button 
                  onClick={() => setActiveTab('latest')}
                  className={`${activeTab === 'latest' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'} font-bold text-sm px-6 py-2 rounded-full transition-all text-center`}
                >
                  Latest
                </button>
                <button 
                  onClick={handleTrendingClick}
                  className={`${activeTab === 'trending' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'} font-bold text-sm px-6 py-2 rounded-full transition-all text-center`}
                >
                  Trending
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              {blogPosts.slice(0, visibleCount).map((post, i) => (
                <Link href={`/blog/${post.slug}`} key={i} className="group flex flex-col bg-surface-dark rounded-3xl border border-border-dark overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all duration-300 relative">
                  <div className="h-56 bg-primary/5 relative overflow-hidden flex items-center justify-center w-full">
                    <Image 
                      src={getCategoryThumb(post.category)} 
                      alt={post.category} 
                      width={400}
                      height={250}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/40 to-transparent"></div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-1 transform translate-y-0 relative z-10 bg-surface-dark">
                    <span className="text-[11px] text-primary font-extrabold tracking-widest uppercase mb-3 block">{post.category}</span>
                    <h4 className="text-[22px] font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{post.title}</h4>
                    <p className="text-text-secondary text-[15px] line-clamp-3 mb-6 flex-1 leading-relaxed">{post.excerpt}</p>
                    <span className="text-primary text-[15px] font-bold inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read More 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {visibleCount < blogPosts.length && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 4)}
                  className="bg-transparent border-2 border-border-dark text-white font-bold px-8 py-3.5 rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  Load More Articles
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-full xl:w-[350px] shrink-0 space-y-8">
            
            {/* Newsletter Box */}
            <div className="bg-primary rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(37,224,121,0.4)] text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-all duration-700"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-extrabold mb-3 tracking-tight leading-tight">Join 53k+ growth hackers</h3>
                <p className="text-white/90 text-[15px] mb-6 leading-relaxed">Get weekly social media tips, algorithm updates, and viral strategies delivered straight to your inbox.</p>
                <form className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    className="w-full bg-white/10 focus:bg-white text-white focus:text-background-dark placeholder-white/80 focus:placeholder-text-secondary border border-white/20 focus:border-white px-5 py-3.5 rounded-xl transition-all outline-none font-medium" 
                  />
                  <button type="button" className="w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-white/95 transition-colors shadow-md text-base">
                    Subscribe Now
                  </button>
                </form>
                <p className="text-[11px] text-white/80 text-center mt-5">No spam. Unsubscribe at any time.</p>
              </div>
            </div>

            {/* Popular Categories */}
            <div className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-sm">
              <h3 className="text-[19px] font-extrabold text-white mb-6 flex items-center gap-2.5 pb-4 border-b border-border-dark">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Popular Categories
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'TikTok Growth', count: 24 },
                  { name: 'Instagram Strategy', count: 18 },
                  { name: 'Content Creation', count: 31 },
                  { name: 'Ads & Monetization', count: 12 },
                  { name: 'SMM Strategies', count: 45 },
                ].map((cat, i) => (
                  <Link key={i} href="#" className="flex items-center justify-between text-text-secondary hover:text-primary transition-colors group py-1">
                    <span className="font-medium text-[15px]">{cat.name}</span>
                    <span className="bg-background-dark px-2.5 py-1 rounded-[8px] border border-border-dark text-[11px] font-bold group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary transition-all text-text-secondary">{cat.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trending This Week */}
            <div id="trending-section" className="bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-sm scroll-mt-32">
              <h3 className="text-[19px] font-extrabold text-white mb-6 pb-4 border-b border-border-dark">Trending This Week</h3>
              <div className="space-y-6">
                {[
                  { title: 'The Ultimate Guide to TikTok Algorithm in 2026', date: 'March 5, 2026', slug: 'tiktok-algorithm-2026' },
                  { title: 'What Is an SMM Panel? Beginner Guide to Growth', date: 'March 8, 2026', slug: 'what-is-an-smm-panel' },
                  { title: 'Why Social Proof is Critical for E-commerce', date: 'Feb 28, 2026', slug: 'social-proof-ecommerce' }
                ].map((post, i) => (
                  <Link key={i} href={`/blog/${post.slug}`} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 rounded-xl bg-background-dark border border-border-dark shrink-0 flex items-center justify-center overflow-hidden relative">
                      <Image 
                        src="/cat-trending.png" 
                        alt="Trending" 
                        width={64}
                        height={64}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-[14px] line-clamp-2 group-hover:text-primary transition-colors leading-[1.3]">{post.title}</h4>
                      <span className="text-[12px] text-text-secondary mt-1.5 block font-medium">{post.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>

      {/* Quick FAQ Section */}
      <section className="bg-primary/5 py-24 px-4 sm:px-6 lg:px-8 border-y border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:items-center">
          
          {/* Left Column: Quick Questions */}
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-text-primary mb-4 leading-tight">Got a quick question?</h2>
            <p className="text-text-secondary text-base mb-10 max-w-xl leading-relaxed">
              Why waste your time clicking through our site looking for answers? Got a quick question, maybe we&apos;ve already got the answer here.
            </p>
            
            <div className="space-y-0 max-w-2xl">
              {[
                { q: 'DO I NEED TO GIVE YOU MY PASSWORD?', a: 'Absolutely not. Your password or any other private info is never required...' },
                { q: 'WILL YOUR SERVICE GET MY ACCOUNT BANNED?', a: 'Absolutely not! We\'ve been operating successfully for years with zero bans...' },
                { q: 'IS IT SAFE TO PURCHASE FROM YOU?', a: 'Of course! We understand your worries about security and take it seriously...' }
              ].map((item, idx) => (
                <Link key={idx} href="/faq" className="group flex items-center justify-between py-6 border-b border-primary/10 hover:border-primary/30 transition-colors">
                  <div className="flex-1 pr-8">
                    <h3 className="text-[14px] font-extrabold text-text-primary uppercase tracking-wider mb-1.5 group-hover:text-primary transition-colors">{item.q}</h3>
                    <p className="text-[13px] text-text-secondary leading-normal">{item.a}</p>
                  </div>
                  <div className="shrink-0 text-primary group-hover:translate-x-2 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-10">
              <Link href="/faq" className="text-text-secondary text-[15px] font-medium hover:text-primary transition-colors inline-flex items-center gap-1.5">
                Didn&apos;t find what you were looking for? <span className="text-text-primary font-bold border-b border-text-primary/30 hover:border-primary">Go to FAQ page</span>
              </Link>
            </div>
          </div>
          
          {/* Right Column: Trust Features */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
            {[
              {
                title: 'Safe & Secure',
                desc: 'Our networks are built in a way that provides you with the best and safest service out there.',
                icon: (
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )
              },
              {
                title: '100% Satisfaction',
                desc: 'Our roster of satisfied customers continues to grow because of the quality of our services.',
                icon: (
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              },
              {
                title: 'Customer Support',
                desc: 'Rest assured that our support team is waiting to answer any question or concern you may have.',
                icon: (
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: 'Money Back Guarantee',
                desc: 'Satisfaction is our top priority! If you are not happy with our service, we guarantee a 100% money back.',
                icon: (
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-5">
                <div className="shrink-0 flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-primary/5 border-b-[3px] border-b-primary/10">
                  {feature.icon}
                </div>
                <div className="flex flex-col pt-1">
                  <h4 className="text-[17px] font-extrabold text-text-primary mb-2 leading-tight">{feature.title}</h4>
                  <p className="text-[14px] text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      <Footer />
    </div>
  );
}
