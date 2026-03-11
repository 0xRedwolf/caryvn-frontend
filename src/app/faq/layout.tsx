import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions - Caryvn SMM Panel',
  description: 'Got questions about our SMM services? Find answers about delivery speed, safety, refills, payment methods, and reselling on the Caryvn FAQ page.',
  keywords: ['SMM FAQ', 'Social Media Marketing Questions', 'Caryvn Support', 'SMM Safety', 'SMM Refills'],
  openGraph: {
    title: 'Frequently Asked Questions - Caryvn SMM Panel',
    description: 'Find answers to all your questions about Caryvn SMM services, from delivery speed to payment security.',
    url: 'https://www.caryvn.com/faq',
    type: 'website',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
