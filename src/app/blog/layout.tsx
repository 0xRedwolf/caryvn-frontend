import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Official Blog - Social Media Marketing Tips & Tricks | Caryvn',
  description: 'Stay ahead of the curve with the Caryvn blog. Expert insights on TikTok algorithms, Instagram strategies, and the best SMM tools for 2026.',
  keywords: ['Social Media Blog', 'How to grow your account fast 2026', 'How to get more followers 2026', 'How to get more likes 2026', 'How to get more views 2026', 'How to get more comments 2026', 'How to get more shares 2026', 'How to get more saves 2026', 'How to get more retweets 2026', 'SMM Tips', 'TikTok Algorithm 2026', 'Instagram Marketing', 'Growth Hacking'],
  openGraph: {
    title: 'Caryvn Official Blog - Grow Your Social Media Presence',
    description: 'Expert tips and latest social media trends to help you dominate the digital landscape in 2026.',
    url: 'https://www.caryvn.com/blog',
    type: 'website',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
