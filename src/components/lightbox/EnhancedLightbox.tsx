"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useCallback, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface Photo {
  id: number;
  slug: string;
  src: string;
  title: string;
}

interface EnhancedLightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function EnhancedLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: EnhancedLightboxProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const currentPhoto = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) {
            setIsLoaded(false);
            onNavigate(currentIndex - 1);
          }
          break;
        case "ArrowRight":
          if (hasNext) {
            setIsLoaded(false);
            onNavigate(currentIndex + 1);
          }
          break;
      }
    },
    [currentIndex, hasPrev, hasNext, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && hasNext) {
        // Swipe left -> next
        setIsLoaded(false);
        onNavigate(currentIndex + 1);
      } else if (diff < 0 && hasPrev) {
        // Swipe right -> prev
        setIsLoaded(false);
        onNavigate(currentIndex - 1);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToPrev = () => {
    if (hasPrev) {
      setIsLoaded(false);
      onNavigate(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setIsLoaded(false);
      onNavigate(currentIndex + 1);
    }
  };

  // Preload adjacent images
  useEffect(() => {
    const preloadImages: string[] = [];
    if (hasPrev) preloadImages.push(photos[currentIndex - 1].src);
    if (hasNext) preloadImages.push(photos[currentIndex + 1].src);

    preloadImages.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [currentIndex, hasPrev, hasNext, photos]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Photo counter */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Previous button */}
      {hasPrev && (
        <button
          className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
          onClick={goToPrev}
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
          onClick={goToNext}
          aria-label="Next photo"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main image container - click to close */}
      <div
        className="relative w-[90vw] h-[90vh] cursor-zoom-out"
        onClick={onClose}
      >
        {/* Loading indicator */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Image */}
        <Image
          key={currentPhoto.src}
          src={currentPhoto.src}
          alt={currentPhoto.title}
          fill
          className={`object-contain transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          sizes="90vw"
          priority
          onLoad={() => setIsLoaded(true)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Photo title & actions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center max-w-xl px-4">
        <h3 className="text-white font-serif text-lg mb-3">{currentPhoto.title}</h3>

        {/* View Details Link */}
        <Link
          href={`/photo/${currentPhoto.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors"
        >
          <span>查看詳情</span>
          <ExternalLink className="w-4 h-4" />
        </Link>

        {/* Keyboard hints */}
        <div className="text-white/50 text-xs flex items-center justify-center gap-4">
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/10 rounded">←</kbd>
            <kbd className="px-2 py-0.5 bg-white/10 rounded">→</kbd>
            <span>Navigate</span>
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white/10 rounded">Esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
