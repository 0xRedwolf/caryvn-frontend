'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface BlogVideoEmbedProps {
  videoId?: string;
  videoUrl?: string;
  posterUrl?: string;
  provider?: string;
  title?: string;
}

export default function BlogVideoEmbed({
  videoId = '',
  videoUrl = '',
  posterUrl = '',
  provider = 'youtube',
  title = '',
}: BlogVideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  // Direct Cloudinary / HTML5 Video player
  if (provider === 'cloudinary' || provider === 'direct' || videoUrl) {
    const finalSrc = videoUrl || (videoId.startsWith('http') ? videoId : '');
    const finalPoster =
      posterUrl ||
      (finalSrc.includes('cloudinary') && finalSrc.endsWith('.mp4')
        ? finalSrc.replace(/\.mp4$/i, '.jpg')
        : '');

    return (
      <figure className="my-10">
        <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md">
          <video
            controls
            playsInline
            preload="metadata"
            poster={finalPoster || undefined}
            className="w-full h-full object-cover"
          >
            <source src={finalSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        {title && (
          <figcaption className="mt-2 text-center text-xs text-slate-500 font-medium italic">
            {title}
          </figcaption>
        )}
      </figure>
    );
  }

  // YouTube Embed Player
  const cleanId = videoId
    .replace(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)/, '')
    .replace(/[^#&?]*$/, (m) => m);

  const thumbnailUrl = thumbError
    ? `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`;

  if (!cleanId) return null;

  return (
    <figure className="my-10">
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md group">
        {!isPlaying ? (
          <div
            onClick={() => setIsPlaying(true)}
            className="relative w-full h-full cursor-pointer overflow-hidden flex items-center justify-center"
          >
            {/* Poster Thumbnail */}
            <Image
              src={thumbnailUrl}
              alt={title || 'Watch video'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
              sizes="(max-width: 1024px) 100vw, 850px"
              onError={() => setThumbError(true)}
            />

            {/* Dark vignette gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/40 group-hover:via-transparent transition-all" />

            {/* Video Title Header */}
            {title && (
              <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-10">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md mb-2">
                  YouTube Video
                </span>
                <p className="text-white text-xs sm:text-sm font-bold truncate drop-shadow-md">
                  {title}
                </p>
              </div>
            )}

            {/* Glowing Play Button */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 ring-4 ring-white/20">
                <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1" />
              </div>
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest drop-shadow-sm">
                Click to Play
              </span>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0&modestbranding=1`}
            title={title || 'YouTube video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>

      {title && !isPlaying && (
        <figcaption className="mt-2 text-center text-xs text-slate-500 font-medium italic">
          {title}
        </figcaption>
      )}
    </figure>
  );
}
