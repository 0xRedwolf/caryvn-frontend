import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reseller API Documentation | Caryvn SMM Panel',
  description:
    'Full SMM Panel v2 REST API documentation for Caryvn resellers. Automate orders, check balance, and manage services programmatically. API endpoint: https://api.caryvn.com/api/v2/',
  keywords: [
    'SMM panel API', 'reseller API', 'SMM API documentation', 'social media panel API',
    'Caryvn API', 'SMM v2 API', 'order automation API', 'Instagram reseller API',
  ],
  openGraph: {
    title: 'Reseller API Documentation | Caryvn',
    description: 'Automate your SMM panel orders with the Caryvn REST API. SMM Panel v2 compatible.',
    url: 'https://www.caryvn.com/api-docs',
    siteName: 'Caryvn',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reseller API Documentation | Caryvn',
    description: 'Automate your SMM panel orders with the Caryvn REST API. Full documentation with code examples.',
  },
  alternates: {
    canonical: 'https://www.caryvn.com/api-docs',
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
