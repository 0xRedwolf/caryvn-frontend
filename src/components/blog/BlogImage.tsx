'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, X } from 'lucide-react';

interface BlogImageProps {
  src: string;
  alt?: string;
  caption?: string;
  aspect?: string;
}

function getImageAspectStyles(aspect?: string): { containerClass: string; imageClass: string } {
  switch (aspect) {
    case '1:1':
    case 'square':
      return {
        containerClass: 'aspect-square max-w-xl mx-auto',
        imageClass: 'object-cover',
      };
    case '9:16':
      return {
        containerClass: 'aspect-[9/16] max-w-xs sm:max-w-sm mx-auto',
        imageClass: 'object-cover',
      };
    case '3:4':
      return {
        containerClass: 'aspect-[3/4] max-w-md sm:max-w-lg mx-auto',
        imageClass: 'object-cover',
      };
    case '4:3':
      return {
        containerClass: 'aspect-[4/3] w-full',
        imageClass: 'object-cover',
      };
    case '16:9':
      return {
        containerClass: 'aspect-video w-full',
        imageClass: 'object-cover',
      };
    case 'auto':
    case 'natural':
      return {
        containerClass: 'aspect-16/10 sm:aspect-16/9 w-full',
        imageClass: 'object-contain bg-slate-900/5',
      };
    default:
      return {
        containerClass: 'aspect-16/10 sm:aspect-16/9 w-full',
        imageClass: 'object-cover',
      };
  }
}

export default function BlogImage({ src, alt = '', caption, aspect }: BlogImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return null;

  const { containerClass, imageClass, style } = getImageAspectStyles(aspect);

  return (
    <>
      <figure className="my-8 group relative">
        <div
          onClick={() => setIsOpen(true)}
          className={`relative ${containerClass} w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs cursor-zoom-in transition-all duration-300 hover:shadow-lg hover:border-slate-300`}
          style={style}
        >
          <Image
            src={src}
            alt={alt || caption || 'Blog image'}
            fill
            className={`${imageClass} transition-transform duration-500 group-hover:scale-[1.02]`}
            sizes="(max-width: 768px) 100vw, 850px"
          />

          {/* Hover Overlay with Zoom Icon */}
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="p-2.5 rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-xs transform scale-90 group-hover:scale-100 transition-all">
              <ZoomIn className="w-5 h-5" />
            </span>
          </div>
        </div>

        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-slate-500 font-medium italic leading-relaxed px-4">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close image preview"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center"
          >
            <div className="relative w-full h-[65vh] sm:h-[75vh]">
              <Image
                src={src}
                alt={alt || caption || 'Enlarged blog image'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {caption && (
              <p className="mt-3 text-center text-xs sm:text-sm text-slate-200 font-medium max-w-xl">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
