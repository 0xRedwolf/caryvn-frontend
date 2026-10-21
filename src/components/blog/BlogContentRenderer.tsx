'use client';

import React, { useMemo } from 'react';
import BlogImage from './BlogImage';
import BlogGallery, { GalleryImage } from './BlogGallery';
import BlogVideoEmbed from './BlogVideoEmbed';

interface BlogContentRendererProps {
  content: string;
}

type ContentBlock =
  | { type: 'html'; html: string }
  | { type: 'image'; src: string; alt?: string; caption?: string; aspect?: string }
  | { type: 'gallery'; images: GalleryImage[]; aspect?: string }
  | {
      type: 'video';
      videoId?: string;
      videoUrl?: string;
      posterUrl?: string;
      provider?: string;
      title?: string;
    };

// Helper to extract image src, alt, caption from an HTML snippet
function parseImageTag(html: string): { src: string; alt?: string; caption?: string } | null {
  const srcMatch = html.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) return null;

  const altMatch = html.match(/alt=["']([^"']*)["']/i);
  const captionMatch = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);

  // Clean caption text (strip inner HTML tags for safety)
  const captionText = captionMatch ? captionMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

  return {
    src: srcMatch[1],
    alt: altMatch ? altMatch[1] : undefined,
    caption: captionText || undefined,
  };
}

// Helper to parse all images inside a gallery container
function parseGalleryBlock(html: string): GalleryImage[] {
  const images: GalleryImage[] = [];

  // Match all <figure>...</figure> blocks inside gallery, or direct <img> tags
  const figureRegex = /<figure[^>]*>([\s\S]*?)<\/figure>/gi;
  let match;

  while ((match = figureRegex.exec(html)) !== null) {
    const parsed = parseImageTag(match[0]);
    if (parsed) images.push(parsed);
  }

  // Fallback: If no <figure> tags, find standalone <img> tags
  if (images.length === 0) {
    const imgRegex = /<img[^>]+>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const parsed = parseImageTag(match[0]);
      if (parsed) images.push(parsed);
    }
  }

  return images;
}

// Helper to extract video info (Cloudinary direct or YouTube)
function parseVideoBlock(
  html: string
): { videoId?: string; videoUrl?: string; posterUrl?: string; provider?: string; title?: string } | null {
  const providerMatch = html.match(/data-provider=["']([^"']+)["']/i);
  const titleMatch = html.match(/data-title=["']([^"']+)["']/i);
  const provider = providerMatch ? providerMatch[1].toLowerCase() : undefined;
  const title = titleMatch ? titleMatch[1] : undefined;

  // 1. Direct Cloudinary / MP4 video check
  const directVideoUrlMatch = html.match(/(?:data-video-url|src)=["']([^"']+\.(?:mp4|webm|mov|ogg)[^"']*)["']/i);
  if (provider === 'cloudinary' || provider === 'direct' || directVideoUrlMatch) {
    const posterMatch = html.match(/poster=["']([^"']+)["']/i);
    const videoUrl = directVideoUrlMatch ? directVideoUrlMatch[1] : '';
    return {
      videoUrl,
      posterUrl: posterMatch ? posterMatch[1] : undefined,
      provider: provider || 'cloudinary',
      title,
    };
  }

  // 2. Check data-video-id attribute for YouTube
  const dataIdMatch = html.match(/data-video-id=["']([^"']+)["']/i);
  if (dataIdMatch && dataIdMatch[1]) {
    return { videoId: dataIdMatch[1], provider: 'youtube', title };
  }

  // 3. Check iframe or URL for YouTube patterns
  const urlMatch = html.match(/(?:src|data-url)=["']([^"']+)["']/i);
  if (urlMatch) {
    const url = urlMatch[1];
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return { videoId: ytMatch[1], provider: 'youtube', title };
    }
  }

  return null;
}

export default function BlogContentRenderer({ content }: BlogContentRendererProps) {
  const blocks = useMemo<ContentBlock[]>(() => {
    if (!content) return [];

    const result: ContentBlock[] = [];

    // Master regex matching custom rich blocks:
    // 1. <div ... class="...blog-gallery..." ...>...</div>
    // 2. <div ... class="...blog-video..." ...>...</div>
    // 3. <figure ... class="...blog-image..." ...>...</figure>
    // 4. Standalone YouTube iframe
    // 5. Standalone <video>...</video>
    const blockRegex = /(?:<div[^>]*class=["'][^"']*\bblog-gallery\b[^"']*["'][^>]*>[\s\S]*?<\/div>)|(?:<div[^>]*class=["'][^"']*\bblog-video\b[^"']*["'][^>]*>[\s\S]*?<\/div>)|(?:<figure[^>]*class=["'][^"']*\bblog-image\b[^"']*["'][^>]*>[\s\S]*?<\/figure>)|(?:<iframe[^>]*src=["'][^"']*(?:youtube\.com|youtu\.be)[^"']*["'][^>]*>[\s\S]*?<\/iframe>)|(?:<video[^>]*>[\s\S]*?<\/video>)/gi;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(content)) !== null) {
      // Any text prior to this block is standard HTML
      if (match.index > lastIndex) {
        const precedingHtml = content.substring(lastIndex, match.index).trim();
        if (precedingHtml) {
          result.push({ type: 'html', html: precedingHtml });
        }
      }

      const matchedString = match[0];
      const aspectMatch = matchedString.match(/data-aspect=["']([^"']+)["']/i);
      const aspect = aspectMatch ? aspectMatch[1].trim() : undefined;

      if (/\bblog-gallery\b/i.test(matchedString)) {
        const images = parseGalleryBlock(matchedString);
        if (images.length > 0) {
          result.push({ type: 'gallery', images, aspect });
        } else {
          result.push({ type: 'html', html: matchedString });
        }
      } else if (
        /\bblog-video\b/i.test(matchedString) ||
        /<iframe/i.test(matchedString) ||
        /<video/i.test(matchedString)
      ) {
        const video = parseVideoBlock(matchedString);
        if (video) {
          result.push({
            type: 'video',
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            posterUrl: video.posterUrl,
            provider: video.provider,
            title: video.title,
          });
        } else {
          result.push({ type: 'html', html: matchedString });
        }
      } else if (/\bblog-image\b/i.test(matchedString)) {
        const img = parseImageTag(matchedString);
        if (img) {
          result.push({ type: 'image', src: img.src, alt: img.alt, caption: img.caption, aspect });
        } else {
          result.push({ type: 'html', html: matchedString });
        }
      }

      lastIndex = blockRegex.lastIndex;
    }

    // Append any trailing HTML
    if (lastIndex < content.length) {
      const remainingHtml = content.substring(lastIndex).trim();
      if (remainingHtml) {
        result.push({ type: 'html', html: remainingHtml });
      }
    }

    return result;
  }, [content]);

  if (!content) return null;

  return (
    <div className="blog-rich-content space-y-6">
      {blocks.map((block, idx) => {
        if (block.type === 'html') {
          return (
            <div
              key={idx}
              className="article-html-chunk"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }

        if (block.type === 'image') {
          return (
            <BlogImage
              key={idx}
              src={block.src}
              alt={block.alt}
              caption={block.caption}
              aspect={block.aspect}
            />
          );
        }

        if (block.type === 'gallery') {
          return <BlogGallery key={idx} images={block.images} aspect={block.aspect} />;
        }

        if (block.type === 'video') {
          return (
            <BlogVideoEmbed
              key={idx}
              videoId={block.videoId}
              videoUrl={block.videoUrl}
              posterUrl={block.posterUrl}
              provider={block.provider}
              title={block.title}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
