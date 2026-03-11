'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 mb-8">
            Legal
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
            Terms of <span className="text-primary">Service</span>
          </h1>
          
          <div className="prose prose-invert prose-lg max-w-none text-text-secondary leading-relaxed">
            <p className="mb-8">Last updated: March 10, 2026</p>
            
            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">1. Agreement to Terms</h2>
              <p>By accessing or using Caryvn, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">2. Services</h2>
              <p>Caryvn provides social media marketing services designed to help you grow your online presence. We reserve the right to modify or discontinue any service at our discretion without prior notice.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">3. Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">4. Delivery Policy</h2>
              <p>Delivery times for our services vary based on the specific package selected. While we strive for immediate start, high-volume orders or platform updates may cause temporary delays. We guarantee eventual delivery or a full refund.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">5. Refund Policy</h2>
              <p>Refunds are processed if a service is not delivered as described within the specified timeframe. Once a service has been completed, refunds are generally not issued unless a technical error occurred on our end.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">6. Prohibited Activities</h2>
              <p>You agree not to use our services for any illegal purposes or to violate the terms of service of the social media platforms themselves. We reserve the right to terminate accounts that engage in fraudulent behavior.</p>
            </section>

            <div className="bg-primary/20 rounded-3xl p-8 mt-16 text-center">
              <p className="text-white font-bold">Have questions regarding our terms?</p>
              <p className="text-sm">Contact our legal team at legal@caryvn.com</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
