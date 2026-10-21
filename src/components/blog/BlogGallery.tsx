'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface BlogGalleryProps {
  images: GalleryImage[];
  aspect?: string;
}

function getGalleryAspect(aspect?: string, isDesktop?: boolean): { className: string; style?: React.CSSProperties } {
  switch (aspect) {
    case '1:1':
    case 'square':
      return { className: 'aspect-square', style: { aspectRatio: '1 / 1' } };
    case '4:3':
      return { className: 'aspect-4/3', style: { aspectRatio: '4 / 3' } };
    case '3:4':
      return { className: 'aspect-[3/4]', style: { aspectRatio: '3 / 4' } };
    case '9:16':
      return { className: 'aspect-[9/16]', style: { aspectRatio: '9 / 16' } };
    case '16:9':
      return { className: 'aspect-video', style: { aspectRatio: '16 / 9' } };
    default:
      return isDesktop
        ? { className: 'aspect-16/11', style: { aspectRatio: '16 / 11' } }
        : { className: 'aspect-16/10', style: { aspectRatio: '16 / 10' } };
  }
}

export default function BlogGallery({ images, aspect }: BlogGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll listener to update active index on mobile swipe
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < images.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, images.length]);

  const scrollToSlide = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: idx * el.offsetWidth,
      behavior: 'smooth',
    });
    setActiveIndex(idx);
  };

  const nextSlide = () => {
    const next = (activeIndex + 1) % images.length;
    scrollToSlide(next);
  };

  const prevSlide = () => {
    const prev = (activeIndex - 1 + images.length) % images.length;
    scrollToSlide(prev);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, images.length]);

  if (!images || images.length === 0) return null;

  const mobileAspect = getGalleryAspect(aspect, false);
  const desktopAspect = getGalleryAspect(aspect, true);

  return (
    <>
      <div className="my-10 relative">
        {/* Mobile Swipeable Carousel (visible on < md screens) */}
        <div className="block md:hidden">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`w-full shrink-0 snap-center relative ${mobileAspect.className} cursor-pointer`}
                  style={mobileAspect.style}
                  onClick={() => setLightboxIndex(i)}
                >
                  <Image
                    src={img.src}
                    alt={img.alt || img.caption || `Gallery image ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent p-3 pt-6 text-white text-[11px] font-medium text-center">
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Previous / Next Arrow Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous image"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center hover:bg-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next image"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center hover:bg-white transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Counter Badge - matches pagination buttons */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 text-slate-800 shadow-md border border-slate-200/50 backdrop-blur-xs text-xs font-black tracking-tight select-none">
              {activeIndex + 1} / {images.length}
            </div>
          </div>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`transition-all rounded-full cursor-pointer ${
                    activeIndex === i ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Layout (visible on >= md screens) */}
        <div className="hidden md:block">
          <div
            className={`grid gap-3.5 ${
              images.length === 2
                ? 'grid-cols-2'
                : images.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {images.map((img, i) => (
              <figure
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={`group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 ${desktopAspect.className} shadow-xs cursor-zoom-in transition-all duration-300 hover:shadow-md hover:border-slate-300`}
                style={desktopAspect.style}
              >
                <Image
                  src={img.src}
                  alt={img.alt || img.caption || `Gallery image ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 350px"
                />

                {/* Hover overlay with zoom icon */}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="p-2.5 rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-xs transform scale-90 group-hover:scale-100 transition-all">
                    <ZoomIn className="w-4 h-4" />
                  </span>
                </div>

                {img.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/35 to-transparent p-3 pt-6 text-white text-[11px] font-medium text-center truncate">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
            Click any image to enlarge and browse gallery ({images.length} photos)
          </p>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Top Bar with Counter & Close */}
          <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-6 flex items-center justify-between text-white z-10">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold backdrop-blur-xs">
              {lightboxIndex + 1} of {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close gallery"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Previous / Next Arrow Controls */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
                }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all cursor-pointer z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all cursor-pointer z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main Enlarged Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[80vh] w-full flex flex-col items-center"
          >
            <div className="relative w-full h-[65vh] sm:h-[75vh]">
              <Image
                src={images[lightboxIndex].src}
                alt={images[lightboxIndex].alt || images[lightboxIndex].caption || 'Gallery photo'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {images[lightboxIndex].caption && (
              <p className="mt-3 text-center text-xs sm:text-sm text-slate-200 font-medium max-w-xl">
                {images[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
