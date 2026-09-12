'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';

// Comprehensive service data for tabbed section
const SERVICES_DATA = {
  Instagram: [
    { 
      name: 'Instagram Followers', 
      desc: 'Real & active accounts to boost your credibility.', 
      price: '2.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
        </svg>
      ),
      popular: true
    },
    { 
      name: 'Instagram Likes', 
      desc: 'High-quality likes from genuine profiles.', 
      price: '1.49', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ) 
    },
    { 
      name: 'Instagram Views', 
      desc: 'Boost your Reels and Video content reach.', 
      price: '0.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) 
    },
    { 
      name: 'Instagram Comments', 
      desc: 'Relevant comments to spark conversations.', 
      price: '3.49', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ) 
    },
  ],
  TikTok: [
    { 
      name: 'TikTok Followers', 
      desc: 'Grow your TikTok presence with real fans.', 
      price: '4.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
        </svg>
      ),
      popular: true
    },
    { 
      name: 'TikTok Likes', 
      desc: 'Go viral with genuine likes on your videos.', 
      price: '1.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ) 
    },
    { 
      name: 'TikTok Views', 
      desc: 'Increase your view count and reach FYP.', 
      price: '0.49', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) 
    },
    { 
      name: 'TikTok Shares', 
      desc: 'Boost your visibility with organic shares.', 
      price: '2.49', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ) 
    },
  ],
  YouTube: [
    { 
      name: 'YouTube Subscribers', 
      desc: 'Build a loyal community with real subscribers.', 
      price: '24.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
        </svg>
      ),
      popular: true
    },
    { 
      name: 'YouTube Likes', 
      desc: 'Increase engagement on your videos.', 
      price: '5.49', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ) 
    },
    { 
      name: 'YouTube Views', 
      desc: 'High-retention views for better ranking.', 
      price: '9.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) 
    },
    { 
      name: 'YouTube Watch Hours', 
      desc: 'Get closer to monetization with watch time.', 
      price: '49.99', 
      icon: (
        <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) 
    },
  ]
};

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Delivery',
    description: 'Most orders start within seconds to minutes with real-time progress tracking.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: 'Virtual Numbers & SMS OTP',
    description: 'Bypass phone verification on WhatsApp, Telegram, Google, OpenAI, and 500+ apps.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: '100% Auto-Refund Guarantee',
    description: 'Zero financial risk. If no SMS OTP arrives, your wallet is immediately credited.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Auto Refill Guarantee',
    description: 'Automatic free refills on supported social services if followers or likes drop.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Private & Secure',
    description: 'We never require passwords. Secure checkout with zero personal data leakage.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: '24/7 Live Support',
    description: 'Dedicated support team ready to assist via live chat and ticket support.',
  },
];

const faqs = [
  { q: 'How do Instant Virtual Numbers for SMS OTP work?', a: 'Select your target service (WhatsApp, Telegram, Google, OpenAI, etc.) and country. Caryvn gives you a temporary virtual phone number instantly. When the verification SMS is sent, the code appears directly on your screen in real time.' },
  { q: 'What happens if I do not receive an SMS verification code?', a: 'You are completely protected by our 100% Auto-Refund Guarantee. If no SMS arrives within the activation window, or if you cancel the number, your entire payment is automatically credited back to your Caryvn balance.' },
  { q: 'How fast is social media delivery?', a: 'Most social media services start within 0-15 minutes. Delivery speed varies by platform and package size.' },
  { q: 'Is it safe to use Caryvn?', a: 'Yes! We never ask for account passwords. All social services are delivered safely, and virtual numbers are completely private.' },
  { q: 'What payment methods do you accept?', a: 'We accept instant bank transfers, debit cards, and cryptocurrency through our fast and automated payment gateways.' },
  { q: 'Can I resell your services and numbers?', a: 'Yes. We offer competitive pricing and automated API access for developers, agencies, and resellers.' },
];

const reviews = [
  {
    name: 'Amidat Aliyu',
    role: 'Social Media Manager',
    content: 'Caryvn completely transformed our agency\'s workflow. The API integration was seamless and the instant delivery on Instagram services is unmatched.',
    rating: 5,
  },
  {
    name: 'Michel Ayodele',
    role: 'Content Creator',
    content: 'I\'ve tried dozens of panels, but this one is by far the most reliable. The UI is clean, and the refill guarantee actually works when drops happen.',
    rating: 5,
  },
  {
    name: 'Emmanuel Chukwuemeka',
    role: 'E-commerce Owner',
    content: 'Used their TikTok services to boost my brand\'s visibility. It gave my videos the initial push they needed to hit the algorithm. Highly recommended!',
    rating: 5,
  },
];

const blogPosts = [
  {
    title: 'Top 10 Best SMM Panels for Instagram, TikTok, and YouTube Growth in 2026',
    excerpt: 'Discover the top 10 best SMM panels in 2026 for growing your Instagram, TikTok, and YouTube channels. We review Caryvn, JAP, Peakerr, and more.',
    date: 'March 8, 2026',
    slug: 'top-10-best-smm-panels-2026',
  },
  {
    title: 'What Is an SMM Panel? Beginner Guide to Social Media Growth',
    excerpt: 'Learn what an SMM panel is, how it works, and how businesses use it to grow followers, likes, and views across Instagram, TikTok, and YouTube.',
    date: 'March 8, 2026',
    slug: 'what-is-an-smm-panel',
  },
  {
    title: 'The Ultimate Guide to TikTok Algorithm in 2026',
    excerpt: 'Discover exactly how TikTok decides which videos go viral and how you can optimize your content to hit the For You Page consistently.',
    date: 'March 5, 2026',
    slug: 'tiktok-algorithm-2026',
  },
];

export default function Home() {
  useAuth();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <HomeContent />
      <Footer />
    </div>
  );
}

function HomeContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeServiceTab, setActiveServiceTab] = useState<'Instagram' | 'TikTok' | 'YouTube'>('Instagram');
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use a timeout or requestAnimationFrame to avoid synchronous setState in effect
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);


  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-10 lg:pt-24 lg:pb-10">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-8 text-left max-w-2xl">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                #1 SMM Growth and Instant Virtual Numbers
              </div>
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                Skyrocket Your Socials & <span className="text-primary">Verify Accounts</span> Instantly
              </h1>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                Boost your visibility on Instagram, TikTok & YouTube with authentic followers and likes or rent instant virtual phone numbers to receive SMS OTP codes for WhatsApp, Telegram, Google, OpenAI, and 500+ apps.
              </p>
              <div className="flex flex-wrap gap-4">
                {mounted && !isLoading ? (
                  <>
                    <Link
                      href={isAuthenticated ? "/dashboard" : "/register"}
                      className="flex h-14 min-w-44 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-base font-bold text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      {isAuthenticated ? "Go to Dashboard" : "Get Started Now"}
                    </Link>
                    <Link
                      href="/dashboard/virtual-numbers"
                      className="flex h-14 min-w-44 items-center justify-center gap-2 rounded-xl border-2 border-emerald-600/70 bg-emerald-50 px-6 text-base font-bold text-emerald-700 hover:bg-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Virtual Numbers (OTP)
                    </Link>
                    <Link
                      href="/services"
                      className="flex h-14 min-w-36 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-base font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-2xs"
                    >
                      <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      All Services
                    </Link>
                  </>
                ) : (
                  <div className="h-14 w-full max-w-100 animate-pulse bg-slate-200 rounded-xl" />
                )}
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl"></div>
              <div className="relative aspect-4/3 w-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-lg">
                <Image 
                  src="/landing-hero.png" 
                  alt="SMM Panel Analytics Dashboard" 
                  width={800} 
                  height={600} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured In Logos */}
      <section className="py-12 bg-blue-50/50 border-y border-slate-200">
        <div className="container mx-auto px-4">
          <p className="mb-10 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">As Featured In Global Media</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 cursor-default">
            {['FORBES', 'TECHCRUNCH', 'WIRED', 'ENTREPRENEUR', 'THE VERGE'].map((logo) => (
              <span key={logo} className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter hover:text-primary transition-colors">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-14 lg:py-14" id="why-us">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Why Choose <span className="text-primary">Caryvn?</span></h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We provide the safest and most effective tools to help you stand out in the digital crowd without ever risking your account integrity.
            </p>
          </div>
          
          {/* Mobile Snap Carousel & Desktop Grid */}
          <div className="carousel-snap md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-4 md:pb-0">
            {features.map((feature, i) => (
              <div key={i} className="carousel-item-snap w-[82vw] sm:w-auto group flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-7 sm:p-8 hover:border-primary/30 shadow-xs hover:shadow-md transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Instant Virtual Numbers & SMS Verification Section (ZapOTP Inspired) */}
      <section className="py-16 lg:py-20 relative overflow-hidden bg-white border-y border-slate-200" id="virtual-numbers">
        {/* Background glow accents */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live SMS Network • 180+ Countries Supported
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Instant Virtual Numbers & <span className="text-primary">SMS OTP Verification</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Bypass phone verification prompts on any app without needing a physical SIM. Receive your SMS OTP verification codes online in seconds with a 100% auto-refund guarantee.
            </p>
          </div>

          {/* 4 Guarantee Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Under 30s Delivery</p>
                <p className="text-[11px] text-slate-500">Instant SMS reception</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">100% Auto-Refund</p>
                <p className="text-[11px] text-slate-500">If code never arrives</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">180+ Global Countries</p>
                <p className="text-[11px] text-slate-500">US, UK, NG, EU & more</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Zero Physical SIM</p>
                <p className="text-[11px] text-slate-500">Fully private & disposable</p>
              </div>
            </div>
          </div>

          {/* Interactive Split Grid: Popular Services + Live Demo Terminal */}
          <div className="grid lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
            {/* Left: Popular Apps Showcase (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Supported Verification Services
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Instantly acquire dedicated virtual numbers for top services across the globe:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'WhatsApp', sub: 'Accounts & Business', tag: 'Fast' },
                  { name: 'Telegram', sub: 'Instant Login OTP', tag: 'Hot' },
                  { name: 'Google / Gmail', sub: 'Account Creation', tag: 'Popular' },
                  { name: 'OpenAI ChatGPT', sub: 'AI Verification', tag: 'Active' },
                  { name: 'TikTok', sub: 'Profile Verification', tag: 'High Rate' },
                  { name: 'Instagram', sub: 'Meta Security SMS', tag: 'Instant' },
                  { name: 'Twitter / X', sub: 'Phone Confirmation', tag: 'Active' },
                  { name: '500+ More', sub: 'Discord, Steam, etc.', tag: 'All' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary/40 hover:bg-white transition-all group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {item.sub}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard/virtual-numbers"
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Get a Virtual Number Now
                </Link>
                <span className="text-xs text-slate-500 font-medium">
                  Starting from only ₦700 per activation
                </span>
              </div>
            </div>

            {/* Right: Simulated Real-Time OTP Terminal (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xl relative">
                {/* Mock Mac Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
                      OTP Terminal Active
                    </span>
                  </div>
                </div>

                {/* Simulated Order Card */}
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Virtual Number
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        United States (US)
                      </span>
                    </div>
                    <p className="text-lg font-mono font-black text-slate-900 tracking-wider">
                      +1 (646) 882-9410
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">
                        WhatsApp Code Received
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        9s ago
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white text-center border border-emerald-200 shadow-2xs">
                      <span className="text-2xl font-mono font-black text-emerald-600 tracking-[0.25em]">
                        849-204
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      Use this code to verify your WhatsApp account instantly.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Protection Policy</span>
                    <span className="text-emerald-700 font-bold">100% Auto-Refund Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Tabbed */}
      <section className="bg-slate-50/70 py-10 border-y border-slate-200" id="services">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Our Premium Services</h2>
            
            <div className="inline-flex rounded-2xl bg-white border border-slate-200 p-2 overflow-hidden shadow-2xs">
              {(['Instagram', 'TikTok', 'YouTube'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveServiceTab(tab)}
                  className={`rounded-xl px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeServiceTab === tab ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Snap Carousel & Desktop Grid */}
          <div className="carousel-snap md:grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4 pb-4 md:pb-0">
            {SERVICES_DATA[activeServiceTab].map((service, i) => (
              <div key={i} className="carousel-item-snap w-[78vw] sm:w-auto group flex flex-col rounded-3xl bg-white p-2 border border-slate-200 shadow-2xs hover:border-primary/40 transition-all duration-300 hover:shadow-md">
                <div className="aspect-square w-full rounded-2xl bg-primary/5 flex items-center justify-center relative overflow-hidden group-hover:bg-primary/10 transition-colors">
                  {service.popular && (
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-tighter">Popular</span>
                    </div>
                  )}
                  {service.icon}
                </div>
                <div className="p-6 flex flex-col gap-4 grow">
                   <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors">{service.name.split(' ').slice(1).join(' ')}</h3>
                   <p className="text-sm text-slate-600 leading-relaxed grow">{service.desc}</p>
                   
                   <div className="flex flex-col gap-4 mt-2">
                     <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Starting At</span>
                       <span className="text-3xl font-black text-primary">{formatCurrency(service.price)}</span>
                     </div>
                     <Link 
                       href={isAuthenticated ? "/new-order" : "/register"} 
                       className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-xs hover:bg-primary/90 transition-all"
                     >
                        Get Started
                     </Link>
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link href="/services" className="btn-primary inline-flex items-center gap-3 px-10 rounded-2xl">
              Explore All 800+ Services
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Success Story / Stats */}
      <section className="py-16 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
            <div className="relative group">
              <div className="aspect-square rounded-[3rem] bg-white border border-slate-200 shadow-xl overflow-hidden relative">
                <Image 
                  src="/growth.png" 
                  alt="Growth Success" 
                  width={800} 
                  height={800} 
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay group-hover:bg-transparent transition-colors"></div>
              </div>
              <div className="absolute -bottom-8 -right-8 rounded-3xl bg-primary p-10 shadow-glow hidden md:block">
                <div className="flex items-center gap-6 text-white">
                  <div className="text-6xl font-black tracking-tighter">13M+</div>
                  <div className="text-lg font-bold leading-tight opacity-90 uppercase tracking-widest">Followers<br/>Delivered</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">Jumpstart Your Digital Success Today</h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                Building an audience from scratch in 2026 is harder than ever. Caryvn gives you the critical momentum needed to trigger social algorithms and reach a wider, organic audience faster.
              </p>
              
              <ul className="grid gap-5">
                {[
                  'Instant delivery within minutes of purchase',
                  'High retention rates & refill guarantees',
                  '256-bit SSL encrypted secure checkout',
                  'Real-time order progress monitoring',
                  '115 Countries Served',
                  '24/7 Customer Support'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-800 font-bold text-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <svg className="w-5 h-5 stroke-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="pt-6">
                <Link href="/register" className="btn-primary inline-flex h-14 px-10 rounded-2xl items-center gap-3 text-lg">
                  Start Growing Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* API Strategy Section */}
      <section className="py-8 lg:py-16 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
                B2B Automation
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">Powerful API for Resellers & Agencies</h2>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                Automate your entire panel with our comprehensive REST API. Create orders, monitor status, and scale your business programmatically with zero friction.
              </p>
              
              <div className="grid gap-4">
                {[
                  { title: 'Full REST API access', desc: 'Secure endpoints for all critical operations.' },
                  { title: 'Real-time syncing', desc: 'Instant order updates and status webhooks.' },
                  { title: 'Wholesale pricing', desc: 'Deep discounts for large-volume resellers.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-1 shrink-0">
                       <svg className="w-4 h-4 stroke-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-bold">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-6">
                <Link href="/api-docs" className="btn-primary inline-flex h-14 px-10 rounded-2xl items-center gap-3">
                  Read API Documentation
                </Link>
              </div>
            </div>
            
            <div className="relative group mb-12">
               <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[120px] opacity-30 group-hover:opacity-50 transition-all"></div>
               <div className="bg-primary rounded-[2.5rem] p-10 font-mono text-sm shadow-2xl relative rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-8 border-b border-white/20 pb-6">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="ml-4 text-xs text-white font-bold tracking-widest uppercase">Endpoint_Deploy.json</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="text-yellow-300">{'// Create new high-speed order'}</div>
                       <div className="flex gap-3">
                         <span className="text-white font-black">POST</span>
                         <span className="text-white">/api/v2/orders/create/</span>
                       </div>
                    </div>
                    <pre className="text-white leading-relaxed bg-blue-900/40 p-6 rounded-2xl border border-white/20 overflow-x-auto">
{`{
  "service": 1420,
  "link": "instagr.am/p/ABC",
  "quantity": 50000,
  "dripfeed": true
}`}
                    </pre>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-primary pt-8 pb-12 text-white relative overflow-hidden" id="testimonials">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Trusted By 50,000+ Clients</h2>
            <div className="flex items-center justify-center gap-1 opacity-90">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6 fill-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
              <span className="ml-3 font-black text-lg">4.9/5 Average Rating</span>
            </div>
          </div>

          {/* Mobile Snap Carousel & Desktop Grid */}
          <div className="carousel-snap md:grid gap-6 sm:gap-10 md:grid-cols-3 pb-4 md:pb-0">
            {reviews.map((review, i) => (
              <div key={i} className="carousel-item-snap w-[85vw] sm:w-auto rounded-[2.5rem] bg-white/10 p-7 sm:p-10 backdrop-blur-md border border-white/10 shadow-xl flex flex-col justify-between group hover:bg-white/15 transition-all">
                <div className="mb-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, idx) => (
                      <svg key={idx} className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="text-lg sm:text-xl font-medium leading-relaxed italic opacity-90">&quot;{review.content}&quot;</p>
                </div>
                <div className="flex items-center gap-5 pt-6 border-t border-white/10">
                  <div className="h-12 sm:h-14 w-12 sm:w-14 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl border border-white/10">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-base sm:text-lg leading-tight">{review.name}</h4>
                    <p className="text-xs sm:text-sm opacity-70 font-bold uppercase tracking-wider">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pt-12 pb-16" id="faq">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">FAQs</h2>
              <p className="mt-4 text-slate-600 text-lg">Frequently asked questions about our services and safety protocols.</p>
            </div>
            
            <div className="grid gap-4">
              {faqs.map((faq, index) => (
                <div key={index} className={`rounded-3xl border transition-all duration-300 ${openFaq === index ? 'bg-white border-primary/40 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 sm:p-8 text-left group cursor-pointer"
                  >
                    <span className={`text-base sm:text-lg font-bold transition-colors ${openFaq === index ? 'text-primary' : 'text-slate-900 group-hover:text-primary'}`}>{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ml-4 ${openFaq === index ? 'bg-primary border-primary text-white rotate-180' : 'border-slate-200 text-slate-500 group-hover:border-primary group-hover:text-primary'}`}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 text-slate-600 text-base sm:text-lg leading-relaxed animate-fade-in border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Post Section */}
      <section className="py-12 bg-slate-50" id="blog">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Latest Blog Post</h2>
              <p className="text-lg text-slate-600 max-w-2xl">
                Stay updated with the latest trends, tips, and strategies for social media growth in 2026.
              </p>
            </div>
            <Link 
              href="/blog" 
              className="flex items-center gap-2 text-primary font-bold hover:text-primary-hover transition-colors group"
            >
              View All Blog Posts
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, i) => (
              <Link 
                key={i} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-[2.5rem] bg-primary p-8 md:p-10 shadow-lg hover:shadow-glow-lg hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex flex-col h-full text-white">
                  <div className="flex items-center gap-2 mb-6 opacity-80">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">{post.date}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black leading-tight mb-4 group-hover:underline">
                    {post.title}
                  </h3>
                  
                  <p className="text-white/80 leading-relaxed mb-8 grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-3 font-bold text-sm">
                    Read Article
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="py-12 bg-slate-100/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-700 p-8 lg:p-14 text-center text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150"></div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">Ready to Take Your Social Media<br/><span className="text-blue-200">To the Next Level?</span></h2>
              <p className="max-w-xl text-base sm:text-lg text-blue-100 leading-relaxed font-medium">Join 50,000+ creators and businesses already using Caryvn to dominate every social dashboard in 2026.</p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Link href="/register" className="h-12 px-8 rounded-xl bg-white text-primary text-base font-black shadow-md hover:bg-slate-50 transition-all flex items-center gap-2">
                  Start Boosting Now
                  <svg className="w-5 h-5 stroke-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="/services" className="h-12 px-8 rounded-xl bg-blue-500/30 text-white border border-white/20 text-base font-black hover:bg-blue-500/40 transition-all flex items-center gap-2">
                  View Service List
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}