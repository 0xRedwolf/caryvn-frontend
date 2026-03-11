'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const faqs = [
  {
    q: 'How fast is delivery?',
    a: 'Most services start within 0-15 minutes of payment. Delivery speed varies by the specific service type and quantity ordered, but we pride ourselves on having some of the fastest turnaround times in the industry.',
    category: 'Orders'
  },
  {
    q: 'Is it safe to use?',
    a: 'Absolutely! We never ask for your account password. All our services are delivered using official APIs and safe, organic-style methods that comply with social media platform guidelines to ensure your account remains secure.',
    category: 'Safety'
  },
  {
    q: 'Do you offer refills?',
    a: 'Yes, many of our high-quality services include a refill guarantee. If you experience any drops, simply contact our support team or use the "Refill" button in your dashboard to have the lost engagement restored for free.',
    category: 'Warranty'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept a wide range of secure payment methods, including major credit cards (Visa, Mastercard, Amex), PayPal, and various cryptocurrencies to ensure a smooth and flexible checkout experience.',
    category: 'Payments'
  },
  {
    q: 'Can I resell your services?',
    a: 'Yes! We offer a specialized API for resellers and provide competitive wholesale pricing. You can easily integrate our services into your own platform and start your own SMM business.',
    category: 'Reselling'
  },
  {
    q: 'Do I need to give you my password?',
    a: 'No, we will never ask for your social media account password. We only need the public link to the profile or post where you want the services delivered.',
    category: 'Safety'
  },
  {
    q: 'Will your service get my account banned?',
    a: 'No. Our methods are optimized for safety and we have had zero reports of account bans following the use of our services.',
    category: 'Safety'
  },
  {
    q: 'Is it safe to purchase from you?',
    a: 'Yes, your safety is our top priority. Our website uses industry-standard SSL encryption to protect your data, and we use established, secure payment gateways for all transactions.',
    category: 'Payments'
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
    <div className="min-h-screen bg-background-dark flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      
      <main className="flex-1 py-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">Frequently Asked <span className="text-primary">Questions</span></h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Everything you need to know about Caryvn services, safety, and delivery. Can&apos;t find what you&apos;re looking for? Contact our 24/7 support.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest">{faq.category}</span>
                  <span className="text-lg font-bold text-text-primary">{faq.q}</span>
                </div>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border-dark transition-all duration-300 ${openIndex === index ? 'bg-primary border-primary text-white rotate-180' : 'bg-transparent text-text-secondary'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
              >
                <div className="p-6 pt-0 text-text-secondary leading-relaxed border-t border-border-dark/50 bg-background-dark/30">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 rounded-[2rem] p-8 md:p-12 text-center border border-primary/10">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Still have questions?</h2>
          <p className="text-text-secondary mb-8">We&apos;re here to help 24/7. Get in touch with our expert team.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:support@caryvn.com" className="bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-primary/20 w-full sm:w-auto">
              Contact Support
            </a>
            <a href="https://wa.me/+2348163685196" className="bg-surface-dark border border-border-dark hover:border-primary text-text-primary hover:text-primary font-bold py-4 px-8 rounded-xl transition-all w-full sm:w-auto">
              Live Chat
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
