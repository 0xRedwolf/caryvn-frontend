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
    description: 'Most orders start within minutes. Real-time progress tracking.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Safe & Secure',
    description: 'We never ask for passwords. Secure payments and encrypted data.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Auto Refill',
    description: 'Free refills on supported services if followers drop.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: '24/7 Support',
    description: 'Expert support team ready to help you anytime.',
  },
];

const faqs = [
  { q: 'How fast is delivery?', a: 'Most services start within 0-15 minutes. Delivery speed varies by service type and quantity.' },
  { q: 'Is it safe to use?', a: 'Yes! We never ask for passwords. All services are delivered through official APIs and safe methods.' },
  { q: 'Do you offer refills?', a: 'Yes, many services include free refills. Look for the "Refill" badge on services.' },
  { q: 'What payment methods do you accept?', a: 'We accept major credit cards and cryptocurrency through our secure payment processors.' },
  { q: 'Can I resell your services?', a: 'Absolutely! We offer competitive reseller pricing and API access for automation.' },
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
    <div className="min-h-screen bg-background-dark">
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
              <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20">
                #1 Trusted SMM Growth Partner
              </div>
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Skyrocket Your <span className="text-primary">Social Presence</span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary dark:text-text-secondary lg:text-primary/70 leading-relaxed">
                Boost your visibility on Instagram, TikTok & YouTube with our premium, organic growth solutions. Buy real followers, likes, views and more, delivered instantly.
              </p>
              <div className="flex flex-wrap gap-5">
                {mounted && !isLoading ? (
                  <>
                    <Link
                      href={isAuthenticated ? "/dashboard" : "/register"}
                      className="flex h-14 min-w-50 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      {isAuthenticated ? "Go to Dashboard" : "Buy Instagram Followers"}
                    </Link>
                    <Link
                      href="/services"
                      className="flex h-14 min-w-50 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-transparent px-8 text-base font-bold text-primary hover:bg-primary/5 transition-all"
                    >
                      <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      View Services
                    </Link>
                  </>
                ) : (
                  <div className="h-14 w-full max-w-100 animate-pulse bg-surface-dark rounded-xl" />
                )}
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl"></div>
              <div className="relative aspect-4/3 w-full rounded-[2.5rem] overflow-hidden">
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
      <section className="py-12 bg-primary/10 border-y border-border-dark">
        <div className="container mx-auto px-4">
          <p className="mb-10 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-text-secondary opacity-60">As Featured In Global Media</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700 cursor-default">
            {['FORBES', 'TECHCRUNCH', 'WIRED', 'ENTREPRENEUR', 'THE VERGE'].map((logo) => (
              <span key={logo} className="text-2xl md:text-3xl font-black text-white tracking-tighter hover:text-primary transition-colors">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-14 lg:py-14" id="why-us">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Why Choose <span className="text-primary">Caryvn?</span></h2>
            <p className="text-lg text-text-secondary dark:text-text-secondary lg:text-primary/70 leading-relaxed">
              We provide the safest and most effective tools to help you stand out in the digital crowd without ever risking your account integrity.
            </p>
          </div>
          
          {/* Mobile Snap Carousel & Desktop Grid */}
          <div className="carousel-snap md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-4 md:pb-0">
            {features.map((feature, i) => (
              <div key={i} className="carousel-item-snap w-[82vw] sm:w-auto group flex flex-col gap-6 rounded-4xl border border-border-dark bg-surface-dark p-7 sm:p-8 hover:border-primary/30 hover:shadow-glow transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - Tabbed */}
      <section className="bg-surface-darker/50 py-10 border-y border-border-dark" id="services">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">Our Premium Services</h2>
            
            <div className="inline-flex rounded-2xl bg-surface-dark border border-border-dark p-2 overflow-hidden shadow-inner">
              {(['Instagram', 'TikTok', 'YouTube'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveServiceTab(tab)}
                  className={`rounded-xl px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold transition-all ${activeServiceTab === tab ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Snap Carousel & Desktop Grid */}
          <div className="carousel-snap md:grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4 pb-4 md:pb-0">
            {SERVICES_DATA[activeServiceTab].map((service, i) => (
              <div key={i} className="carousel-item-snap w-[78vw] sm:w-auto group flex flex-col rounded-3xl bg-surface p-2 border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-glow">
                <div className="aspect-square w-full rounded-2xl bg-primary/5 flex items-center justify-center relative overflow-hidden group-hover:bg-primary/10 transition-colors">
                  {service.popular && (
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md uppercase tracking-tighter">Popular</span>
                    </div>
                  )}
                  {service.icon}
                </div>
                <div className="p-6 flex flex-col gap-4 grow">
                   <h3 className="font-bold text-xl text-text-primary group-hover:text-primary transition-colors">{service.name.split(' ').slice(1).join(' ')}</h3>
                   <p className="text-sm text-text-secondary leading-relaxed grow">{service.desc}</p>
                   
                   <div className="flex flex-col gap-4 mt-2">
                     <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-1">Starting At</span>
                       <span className="text-3xl font-black text-primary">{formatCurrency(service.price)}</span>
                     </div>
                     <Link 
                       href={isAuthenticated ? "/new-order" : "/register"} 
                       className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-sm hover:shadow-glow transition-all"
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
              <div className="aspect-square rounded-[3rem] bg-surface-dark border border-border-dark shadow-2xl overflow-hidden relative">
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
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">Jumpstart Your Digital Success Today</h2>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
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
                  <li key={i} className="flex items-center gap-4 text-white font-bold text-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
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

      {/* Ad Banner - ZapOTP */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <a
            href="https://zapotp.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="ad-banner block relative overflow-hidden rounded-[2.5rem] p-10 md:p-14 group card-hover shadow-2xl"
          >
            <div className="ad-banner-glow-tr" />
            <div className="ad-banner-glow-bl" />

            <div className="relative flex flex-col md:flex-row items-center gap-10">
              <div className="shrink-0 w-20 h-20 rounded-3xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black ad-banner-title mb-3 tracking-tight">
                  Buy Foreign Numbers Instantly
                </h3>
                <p className="ad-banner-desc text-lg opacity-80 max-w-xl leading-relaxed">
                  Get virtual numbers for OTP verification from 80+ countries. Instant activation at <strong className="text-white">zapotp.com</strong>.
                </p>
              </div>

              <div className="shrink-0">
                <span className="btn-primary inline-flex h-14 px-10 rounded-2xl items-center gap-3 whitespace-nowrap shadow-glow">
                  Visit ZapOTP
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* API Strategy Section */}
      <section className="py-4 lg:py-12 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-20 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary border border-border-dark">
                B2B Automation
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">Powerful API for Resellers & Agencies</h2>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                Automate your entire panel with our comprehensive REST API. Create orders, monitor status, and scale your business programmatically with zero friction.
              </p>
              
              <div className="grid gap-4">
                {[
                  { title: 'Full REST API access', desc: 'Secure endpoints for all critical operations.' },
                  { title: 'Real-time syncing', desc: 'Instant order updates and status webhooks.' },
                  { title: 'Wholesale pricing', desc: 'Deep discounts for large-volume resellers.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1 shrink-0">
                       <svg className="w-4 h-4 stroke-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{item.title}</h4>
                      <p className="text-sm text-text-secondary">{item.desc}</p>
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
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="ml-4 text-xs text-white font-bold tracking-widest uppercase">Endpoint_Deploy.json</span>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="text-yellow-500">{'// Create new high-speed order'}</div>
                       <div className="flex gap-3">
                         <span className="text-white font-black">POST</span>
                         <span className="text-white">/api/v2/orders/create/</span>
                       </div>
                    </div>
                    <pre className="text-white leading-relaxed bg-blue-900/30 p-6 rounded-2xl border border-white/10">
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
      <section className="pt-8 pb-12" id="faq">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">FAQs</h2>
              <p className="mt-4 text-text-secondary text-lg">Frequently asked questions about our services and safety protocols.</p>
            </div>
            
            <div className="grid gap-4">
              {faqs.map((faq, index) => (
                <div key={index} className={`rounded-3xl border transition-all duration-300 ${openFaq === index ? 'bg-surface-dark border-primary/40 shadow-glow' : 'bg-surface-dark border-border-dark hover:border-border-dark'}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-8 text-left group"
                  >
                    <span className={`text-lg font-bold transition-colors ${openFaq === index ? 'text-primary' : 'text-white group-hover:text-primary'}`}>{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${openFaq === index ? 'bg-primary border-primary text-white rotate-180' : 'border-border-dark text-text-secondary group-hover:border-primary group-hover:text-primary'}`}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </button>
                  {openFaq === index && (
                    <div className="px-8 pb-8 text-text-secondary dark:text-text-secondary lg:text-primary/70 text-lg leading-relaxed animate-fade-in border-t border-border-dark/30 pt-4">
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
      <section className="py-12 bg-background-dark" id="blog">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Latest Blog Post</h2>
              <p className="text-lg text-text-secondary max-w-2xl">
                Stay updated with the latest trends, tips, and strategies for social media growth in 2026.
              </p>
            </div>
            <Link 
              href="/blog" 
              className="flex items-center gap-2 text-primary font-bold hover:text-white transition-colors group"
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
      <section className="py-8 bg-primary/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-2xl bg-surface-dark p-6 lg:p-10 text-center text-white relative overflow-hidden shadow-lg border border-border-dark">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary via-transparent to-transparent scale-150"></div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">Ready to Take Your Social Media<br/><span className="text-primary">To the Next Level?</span></h2>
              <p className="max-w-xl text-lg opacity-80 leading-relaxed font-medium">Join 50,000+ creators and businesses already using <span className="text-primary font-black">Caryvn</span> to dominate every social dashboard in 2026.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/register" className="h-12 px-8 rounded-xl bg-primary text-base font-black shadow-glow hover:shadow-glow-lg transition-all flex items-center gap-2">
                  Start Boosting Now
                  <svg className="w-5 h-5 stroke-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
                <Link href="/services" className="h-12 px-8 rounded-xl bg-primary text-base font-black shadow-glow hover:shadow-glow-lg transition-all flex items-center gap-2">
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