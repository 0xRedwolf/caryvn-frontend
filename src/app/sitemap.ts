import { MetadataRoute } from 'next';

const defaultSlugs = [
  'best-smm-tools-2026',
  'best-platform-for-business',
  'increase-engagement-2026',
  'social-media-trends-2026',
  'how-often-to-post-2026',
  'beat-social-media-algorithm-2026',
  'organic-vs-paid-social-2026',
  'what-is-an-smm-panel',
  'tiktok-algorithm-2026',
  'social-proof-ecommerce',
  'instagram-vs-youtube-roi',
  'top-10-best-smm-panels-2026',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.caryvn.com';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  let allSlugs = [...defaultSlugs];
  try {
    const res = await fetch(`${API_URL}/blog/`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || [];
      const fetchedSlugs = results.map((p: any) => p.slug).filter(Boolean);
      allSlugs = Array.from(new Set([...defaultSlugs, ...fetchedSlugs]));
    }
  } catch {
    // Fallback to defaultSlugs
  }

  const blogEntries: MetadataRoute.Sitemap = allSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/api-docs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...blogEntries,
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },

  ];
}
