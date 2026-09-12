'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-24 lg:py-32">
        <div>
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 mb-8">
            About Caryvn
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight">
            We Help You <span className="text-primary">Dominate</span> Social Media
          </h1>
          
          <div className="prose prose-slate prose-lg max-w-none">
            <p className="text-slate-600 text-xl leading-relaxed mb-12">
              Founded in 2026, Caryvn has quickly become the #1 trusted partner for social media growth. We specialize in providing high-quality, organic-style engagement for creators, businesses, and influencers worldwide.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
                <p className="text-slate-600">
                  To provide accessible, reliable, and high-speed social media boosting services that help our clients achieve their growth targets and build lasting online authority.
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Why Caryvn?</h3>
                <p className="text-slate-600">
                  Unlike other marketplace, we focus on retention and safety. Our proprietary delivery systems ensure that your growth looks natural and adheres to platform algorithms.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-6">Our Core Values</h2>
            <ul className="space-y-4 text-slate-600 mb-12 list-none p-0">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">✓</div>
                <span><strong>Transparency:</strong> Real-time tracking and clear service descriptions.</span>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">✓</div>
                <span><strong>Speed:</strong> Instant delivery starts on 95% of our services.</span>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">✓</div>
                <span><strong>Security:</strong> 256-bit encryption and no password requirements.</span>
              </li>
            </ul>

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to Start Your Journey?</h2>
              <p className="text-slate-600 mb-8 max-w-xl mx-auto">Join thousands of successful creators who have accelerated their growth with Caryvn.</p>
              <Link href="/register" className="inline-flex h-14 items-center justify-center rounded-xl bg-primary px-10 text-lg font-bold text-white hover:bg-primary-hover shadow-md transition-all">
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
