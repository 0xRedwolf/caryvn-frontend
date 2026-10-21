import { notFound } from 'next/navigation';
import BlogPostView from '@/components/blog/BlogPostView';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchPost(slug: string) {
  try {
    const res = await fetch(`${API_URL}/blog/${slug}/`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        featured_image: data.featured_image,
        read_time: data.read_time,
        published_at: data.published_at,
        views_count: data.views_count,
        category_name: data.category?.name || data.category_name,
        author_name: data.author?.name || data.author_name,
        author_role: data.author?.role,
        author_bio: data.author?.bio,
        author_avatar: data.author?.avatar_url,
        author_social_x: data.author?.social_x,
        author_social_linkedin: data.author?.social_linkedin,
        faqs: data.faqs,
        cta_title: data.cta_title,
        cta_description: data.cta_description,
        cta_button_text: data.cta_button_text,
        cta_url: data.cta_url,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        canonical_url: data.canonical_url,
        related_posts: data.related_posts,
      };
    }
  } catch (err) {
    console.error(`Error fetching post ${slug}:`, err);
  }

  return null;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/blog/?page_size=50`);
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || [];
      return results
        .map((p: any) => ({ slug: p.slug }))
        .filter((item: any) => Boolean(item.slug));
    }
  } catch {
    // API not reachable during build
  }
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: 'Post Not Found - Caryvn Blog' };

  const canonicalUrl = post.canonical_url || `https://www.caryvn.com/blog/${slug}`;
  const ogImageUrl = post.featured_image?.startsWith('http')
    ? post.featured_image
    : `https://www.caryvn.com${post.featured_image || '/logo-full.png'}`;

  return {
    title: post.seo_title || `${post.title} - Caryvn Blog`,
    description: post.seo_description || post.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author_name || 'Alexander Sterling'],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    notFound();
  }

  const articleImageUrl = post.featured_image?.startsWith('http')
    ? post.featured_image
    : `https://www.caryvn.com${post.featured_image || '/logo-full.png'}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: [articleImageUrl],
    author: {
      '@type': 'Person',
      name: post.author_name || 'Alexander Sterling',
      jobTitle: post.author_role || 'Editor In Chief',
      url: post.author_social_linkedin || post.author_social_x || 'https://www.caryvn.com/blog',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Caryvn',
      url: 'https://www.caryvn.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.caryvn.com/svg-logo-light.svg',
      },
    },
    datePublished: post.published_at,
    dateModified: post.published_at,
    url: `https://www.caryvn.com/blog/${slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.caryvn.com/blog/${slug}`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.caryvn.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://www.caryvn.com/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://www.caryvn.com/blog/${slug}`,
      },
    ],
  };

  const faqSchema =
    post.faqs && post.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faqs.map((faq: any) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostView post={post as any} />
    </>
  );
}
