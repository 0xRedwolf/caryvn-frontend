'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { servicesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// Demo services for landing page
const demoServices = [
  { name: 'Instagram Followers [Real HQ]', rate: '0.85', min: 10, max: 50000, category: 'Instagram' },
  { name: 'TikTok Views [Instant]', rate: '0.01', min: 1000, max: 10000000, category: 'TikTok' },
  { name: 'YouTube Subscribers', rate: '15.50', min: 50, max: 5000, category: 'YouTube' },
  { name: 'Twitter Followers [Real]', rate: '3.00', min: 100, max: 25000, category: 'Twitter' },
];

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

const steps = [
  { step: '01', title: 'Choose Service', description: 'Browse our catalog and select the service you need.' },
  { step: '02', title: 'Enter Details', description: 'Provide your link and quantity. See the price instantly.' },
  { step: '03', title: 'Get Results', description: 'Watch your order complete in real-time. Track progress.' },
];

const faqs = [
  { q: 'How fast is delivery?', a: 'Most services start within 0-15 minutes. Delivery speed varies by service type and quantity.' },
  { q: 'Is it safe to use?', a: 'Yes! We never ask for passwords. All services are delivered through official APIs and safe methods.' },
  { q: 'Do you offer refills?', a: 'Yes, many services include free refills. Look for the "Refill" badge on services.' },
  { q: 'What payment methods do you accept?', a: 'We accept major credit cards and cryptocurrency through our secure payment processors.' },
  { q: 'Can I resell your services?', a: 'Absolutely! We offer competitive reseller pricing and API access for automation.' },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              The Best <span className="gradient-text">Social Media Boosting Platform</span>
              <br />
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10">
              Premium social media marketing services at the cheapest prices. 
              Boost your accounts on Instagram, TikTok, YouTube, and more with real, high-quality engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Get Started
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/services"
                className="btn-secondary inline-flex items-center justify-center"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Indicators */}
      <section className="py-12 border-y border-border-dark bg-surface-darker/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-text-secondary text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-text-secondary">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative bg-surface-dark rounded-2xl border border-border-dark p-8">
                <span className="text-6xl font-bold text-primary/10 absolute top-4 right-4">{step.step}</span>
                <h3 className="text-white text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 bg-surface-darker/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Popular Services</h2>
            <p className="text-text-secondary">Trusted by thousands of customers worldwide</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark">
                  <th className="text-left text-text-secondary text-sm font-medium py-4 px-4">Service</th>
                  <th className="text-left text-text-secondary text-sm font-medium py-4 px-4">Platform</th>
                  <th className="text-left text-text-secondary text-sm font-medium py-4 px-4">Rate / 1000</th>
                  <th className="text-left text-text-secondary text-sm font-medium py-4 px-4">Min / Max</th>
                  <th className="text-left text-text-secondary text-sm font-medium py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {demoServices.map((service, index) => (
                  <tr key={index} className="border-b border-border-dark hover:bg-surface-dark/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{service.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text-secondary">{service.category}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-primary font-semibold">{formatCurrency(service.rate)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text-secondary">
                        {service.min.toLocaleString()} / {service.max.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href="/services"
                        className="text-primary hover:text-primary-hover text-sm font-medium"
                      >
                        Order →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <Link href="/services" className="btn-secondary inline-flex items-center gap-2">
              View All Services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <a
            href="https://zapotp.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="ad-banner block relative overflow-hidden rounded-2xl p-8 md:p-12 group card-hover"
          >
            {/* Glow accent */}
            <div className="ad-banner-glow-tr" />
            <div className="ad-banner-glow-bl" />

            <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {/* Icon / Visual */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>

              {/* Copy */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold ad-banner-title mb-2">
                  Buy Foreign Numbers Instantly
                </h3>
                <p className="ad-banner-desc text-sm md:text-base max-w-xl">
                  Get virtual numbers for OTP verification from 80+ countries. Instant activation, affordable prices, and reliable delivery at zapotp.com.
                </p>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <span className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
                  Visit Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* API Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Powerful API for Resellers</h2>
            <p className="text-text-secondary">Integrate our services directly into your own platform</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <p className="text-text-secondary mb-6 text-lg">
                Automate your panel with our comprehensive REST API. Create orders, check status, 
                and manage your business programmatically with ease.
              </p>
              <ul className="space-y-4 mb-8 inline-block md:block text-left">
                {['Full REST API access', 'Real-time order status', 'Competitive reseller pricing', 'Comprehensive documentation'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary">
                    <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link href="/api-docs" className="btn-primary inline-flex items-center gap-2">
                  View API Docs
                </Link>
              </div>
            </div>
            
            <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 font-mono text-sm shadow-2xl relative group">
              {/* Terminal Header Decor */}
              <div className="flex items-center gap-2 mb-6 border-b border-border-dark/50 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <span className="ml-2 text-xs text-text-secondary opacity-50 uppercase tracking-widest">Request.json</span>
              </div>
              
              <pre className="text-blue-400 overflow-x-auto">
{`POST /api/orders/create/
{
  "service_id": 1,
  "link": "https://instagram.com/user",
  "quantity": 1000
}`}
              </pre>
              
              <div className="my-4 border-t border-border-dark/50" />
              
              <pre className="text-emerald-400 overflow-x-auto">
{`Response:
{
  "order": {
    "id": "abc123",
    "status": "processing",
    "charge": "0.85"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface-darker/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Grow Your Social Media?</h2>
          <p className="text-text-secondary mb-8">
            Join thousands of satisfied customers and start growing today.
          </p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 h-12">
            Create Free Account
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-text-secondary transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-text-secondary">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
