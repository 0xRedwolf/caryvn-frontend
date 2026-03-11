import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our SMM Services - Instagram, TikTok, YouTube & More | Caryvn',
  description: 'Explore our wide range of social media growth services. We offer high-quality followers, likes, views, and comments for all major platforms with instant delivery.',
  keywords: ['Instagram Services', 'TikTok Services', 'YouTube Services', 'Buy Followers', 'Buy Likes', 'Buy Views', 'SMM Panel Services'],
  openGraph: {
    title: 'All Social Media Marketing Services - Caryvn',
    description: 'Boost your social media presence with Caryvn. High-quality services for Instagram, TikTok, YouTube, and more.',
    url: 'https://www.caryvn.com/services',
    type: 'website',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
