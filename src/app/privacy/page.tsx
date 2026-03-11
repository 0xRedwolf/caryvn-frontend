'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 mb-8">
            Legal
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          
          <div className="prose prose-invert prose-lg max-w-none text-text-secondary leading-relaxed">
            <p className="mb-8">Last updated: March 10, 2026</p>
            
            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">1. Introduction</h2>
              <p>Welcome to Caryvn. We value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our website and services.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-4">
                <li><strong>Account Information:</strong> When you register, we collect your email address and username. We do NOT store passwords in plain text.</li>
                <li><strong>Order Data:</strong> We collect social media links and quantities required to process your orders.</li>
                <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our website to optimize your experience.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">3. How We Use Your Data</h2>
              <p>Caryvn uses your information primarily to process and deliver your services, communicate about your account, and improve our platform&apos;s security and performance. We do NOT sell your data to third parties.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">4. Cookies</h2>
              <p>We use cookies to keep you logged in and to analyze site traffic. You can choose to disable cookies through your browser settings, though this may limit certain website functionalities.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">5. Data Security</h2>
              <p>We implement industry-standard 256-bit SSL encryption to protect your data during transmission. Payments are handled via secure third-party processors, and we never have access to your full credit card details.</p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6">6. Changes to This Policy</h2>
              <p>Caryvn reserves the right to update this policy at any time. We will notify users of any significant changes via email or through a prominent notice on our website.</p>
            </section>

            <div className="bg-primary/20 rounded-3xl p-8 mt-16 text-center">
              <p className="text-white font-bold">Questions about our privacy practices?</p>
              <p className="text-sm">Contact our support team at support@caryvn.com</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
