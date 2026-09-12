import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | Caryvn Developer & Reseller REST API v2',
  description:
    'Complete SMM Panel v2 REST API documentation for Caryvn. Automate social media orders, query 800+ services, check NGN wallet balance, and track order & refill status programmatically.',
  keywords: [
    'SMM panel API', 'reseller API', 'SMM API documentation', 'social media panel API',
    'Caryvn API', 'SMM v2 API', 'order automation API', 'Instagram reseller API',
    'TikTok API SMM', 'Nigeria SMM API', 'Caryvn developer docs'
  ],
  openGraph: {
    title: 'Developer & Reseller API Documentation | Caryvn',
    description: 'Automate social media orders, query live rates in NGN, and track status with the Caryvn SMM v2 REST API.',
    url: 'https://www.caryvn.com/api-docs',
    siteName: 'Caryvn',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer & Reseller API Documentation | Caryvn',
    description: 'Automate social media orders, query live rates in NGN, and track status with the Caryvn SMM v2 REST API.',
  },
  alternates: {
    canonical: 'https://www.caryvn.com/api-docs',
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
